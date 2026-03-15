import {NextResponse} from "next/server"
import {createClient} from "@sanity/client"
import {apiVersion, dataset, projectId} from "@/sanity/env"
import {getTransport} from "@/lib/mailer"

export const runtime = "nodejs"

function paypalBase() {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase()
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

async function getPayPalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET fehlt")

  const basic = Buffer.from(`${id}:${secret}`).toString("base64")
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const json = await res.json().catch(() => ({} as any))
  if (!res.ok) throw new Error(json?.error_description || "PayPal token error")
  return json.access_token as string
}

function money(n: any) {
  const x = Number(n)
  if (!Number.isFinite(x)) return ""
  return (Math.round(x * 100) / 100).toFixed(2)
}

function escapeHtml(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildMailShell(args: {title: string; intro?: string; bodyHtml: string; footer?: string}) {
  return `
  <div style="margin:0; padding:24px; background:#f7f7f7; font-family:Arial,Helvetica,sans-serif; color:#111;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #eaeaea; border-radius:18px; overflow:hidden;">
      <div style="padding:18px 24px; border-bottom:1px solid #efefef;">
        <div style="font-size:12px; color:#666; letter-spacing:.04em; text-transform:uppercase;">c2r.at · Blutonium Cars</div>
        <div style="margin-top:6px; font-size:28px; line-height:1.15; font-weight:700;">${args.title}</div>
        ${args.intro ? `<div style="margin-top:12px; font-size:16px; line-height:1.6; color:#222;">${args.intro}</div>` : ""}
      </div>

      <div style="padding:24px;">
        ${args.bodyHtml}
      </div>

      ${
        args.footer
          ? `<div style="padding:16px 24px; border-top:1px solid #efefef; font-size:12px; color:#666;">${args.footer}</div>`
          : ""
      }
    </div>
  </div>`
}

function buildItemsTable(items: any[]) {
  const rows = items
    .map((it) => {
      const title = escapeHtml(it?.title)
      const qty = escapeHtml(it?.quantity)
      const unit = money(it?.unitPrice)
      const lineTotal =
        typeof it?.unitPrice === "number" && typeof it?.quantity === "number"
          ? `${money(it.unitPrice * it.quantity)} €`
          : "—"

      return `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f1f1f1; vertical-align:top; font-size:15px; line-height:1.45;">
          ${title}
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #f1f1f1; vertical-align:top; text-align:center; white-space:nowrap; font-size:15px;">
          ${qty}×
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #f1f1f1; vertical-align:top; text-align:right; white-space:nowrap; font-size:15px;">
          ${unit} €
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #f1f1f1; vertical-align:top; text-align:right; white-space:nowrap; font-size:15px; font-weight:700;">
          ${lineTotal}
        </td>
      </tr>`
    })
    .join("")

  return `
  <table style="width:100%; border-collapse:collapse;">
    <thead>
      <tr>
        <th align="left" style="padding:0 0 10px 0; border-bottom:1px solid #ddd; font-size:13px; color:#666;">Artikel</th>
        <th align="center" style="padding:0 0 10px 0; border-bottom:1px solid #ddd; font-size:13px; color:#666;">Menge</th>
        <th align="right" style="padding:0 0 10px 0; border-bottom:1px solid #ddd; font-size:13px; color:#666;">Einzelpreis</th>
        <th align="right" style="padding:0 0 10px 0; border-bottom:1px solid #ddd; font-size:13px; color:#666;">Gesamt</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function buildSummary(order: any) {
  const subtotal = money(order?.subtotal)
  const shipping = money(order?.shippingCost)
  const total = money(order?.amountTotal ?? order?.total)

  return `
  <div style="margin-top:18px; padding:16px 18px; border:1px solid #efefef; border-radius:14px; background:#fafafa;">
    <div style="display:flex; justify-content:space-between; gap:12px; font-size:15px; margin-bottom:8px;">
      <span>Zwischensumme</span>
      <strong>${subtotal} €</strong>
    </div>
    <div style="display:flex; justify-content:space-between; gap:12px; font-size:15px; margin-bottom:8px;">
      <span>Versand</span>
      <strong>${shipping} €</strong>
    </div>
    <div style="display:flex; justify-content:space-between; gap:12px; font-size:20px; font-weight:700;">
      <span>Gesamt</span>
      <span>${total} €</span>
    </div>
  </div>`
}

function buildCustomerOrderEmailHtml(order: any) {
  const orderNumber = order?.orderNumber || order?._id
  const name = order?.customerName || ""
  const items: any[] = Array.isArray(order?.items) ? order.items : []

  return buildMailShell({
    title: `Bestellbestätigung ${escapeHtml(orderNumber)}`,
    intro: `Danke${name ? " " + escapeHtml(name) : ""}! Wir haben deine Bestellung erhalten und bearbeiten sie jetzt.`,
    bodyHtml: `
      ${buildItemsTable(items)}
      ${buildSummary(order)}
      <div style="margin-top:18px; font-size:13px; color:#666;">
        Zahlung: PayPal<br/>
        Bestellnummer: ${escapeHtml(orderNumber)}
      </div>
    `,
    footer: `Diese E-Mail wurde automatisch von c2r.at versendet.`,
  })
}

function buildAdminOrderEmailHtml(order: any) {
  const orderNumber = order?.orderNumber || order?._id
  const items: any[] = Array.isArray(order?.items) ? order.items : []

  return buildMailShell({
    title: `Neue Bestellung ${escapeHtml(orderNumber)}`,
    intro: `
      <strong>Kunde:</strong> ${escapeHtml(order?.customerName || "—")}<br/>
      <strong>E-Mail:</strong> ${escapeHtml(order?.customerEmail || "—")}<br/>
      <strong>Telefon:</strong> ${escapeHtml(order?.customerPhone || "—")}<br/>
      <strong>Zahlung:</strong> PayPal
    `,
    bodyHtml: `
      ${buildItemsTable(items)}
      ${buildSummary(order)}
    `,
    footer: `Neue Bestellung über c2r.at eingegangen.`,
  })
}

export async function POST(req: Request) {
  try {
    const {paypalOrderId} = (await req.json().catch(() => ({}))) as {paypalOrderId?: string}
    if (!paypalOrderId) return NextResponse.json({ok: false, error: "paypalOrderId fehlt"}, {status: 400})

    const writeToken = process.env.SANITY_API_WRITE_TOKEN
    if (!writeToken) return NextResponse.json({ok: false, error: "SANITY_API_WRITE_TOKEN fehlt"}, {status: 500})

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      token: writeToken,
      useCdn: false,
    })

    const accessToken = await getPayPalAccessToken()

    const capRes = await fetch(`${paypalBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    const cap = await capRes.json().catch(() => ({} as any))
    if (!capRes.ok) {
      if (cap?.name !== "ORDER_ALREADY_CAPTURED") {
        return NextResponse.json({ok: false, error: "PayPal capture failed", details: cap}, {status: 400})
      }
    }

    const sanityOrderId = cap?.purchase_units?.[0]?.custom_id || null

    let targetId = sanityOrderId
    if (!targetId) {
      const existing = await writeClient.fetch(
        `*[_type=="order" && provider=="paypal" && providerOrderId==$id][0]{_id}`,
        {id: paypalOrderId}
      )
      targetId = existing?._id || null
    }

    if (!targetId) {
      return NextResponse.json({ok: false, error: "Sanity Order nicht gefunden."}, {status: 404})
    }

    const currency = cap?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || "EUR"
    const amountStr = cap?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
    const amountTotal = typeof amountStr === "string" ? Number(amountStr) : undefined

    await writeClient
      .patch(String(targetId))
      .set({
        status: "paid",
        provider: "paypal",
        providerOrderId: paypalOrderId,
        currency,
        amountTotal: Number.isFinite(amountTotal as any) ? amountTotal : undefined,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .commit()

    try {
      const order = await writeClient.getDocument(String(targetId))
      const adminTo = process.env.MAIL_TO
      const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER
      if (!mailFrom) throw new Error("MAIL_FROM oder SMTP_USER fehlt")

      const transport = getTransport()

      if (order?.customerEmail && !order?.customerEmailSentAt) {
        const subject = `Bestellbestätigung ${order?.orderNumber || order?._id}`
        const html = buildCustomerOrderEmailHtml(order)

        await transport.sendMail({
          from: mailFrom,
          to: order.customerEmail,
          subject,
          html,
        })

        await writeClient.patch(String(targetId)).set({customerEmailSentAt: new Date().toISOString()}).commit()
      }

      if (adminTo && !order?.adminEmailSentAt) {
        const subject = `Neue Bestellung ${order?.orderNumber || order?._id}`
        const html = buildAdminOrderEmailHtml(order)

        await transport.sendMail({
          from: mailFrom,
          to: adminTo,
          subject,
          html,
          replyTo: order?.customerEmail || undefined,
        })

        await writeClient.patch(String(targetId)).set({adminEmailSentAt: new Date().toISOString()}).commit()
      }
    } catch (mailErr) {
      console.error("Order email failed:", mailErr)
    }

    return NextResponse.json({ok: true})
  } catch (err: any) {
    return NextResponse.json({ok: false, error: err?.message ?? String(err)}, {status: 500})
  }
}