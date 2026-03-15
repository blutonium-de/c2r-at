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

function buildCustomerOrderEmailHtml(order: any) {
  const orderNumber = order?.orderNumber || order?._id
  const name = order?.customerName || ""
  const subtotal = money(order?.subtotal)
  const shipping = money(order?.shippingCost)
  const total = money(order?.amountTotal ?? order?.total)
  const items: any[] = Array.isArray(order?.items) ? order.items : []

  const itemsHtml = items
    .map((it) => {
      const title = escapeHtml(it?.title)
      const qty = escapeHtml(it?.quantity)
      const unit = money(it?.unitPrice)
      return `<tr>
        <td style="padding:6px 0;">${title}</td>
        <td style="padding:6px 0; text-align:right;">${qty}×</td>
        <td style="padding:6px 0; text-align:right;">${unit} €</td>
      </tr>`
    })
    .join("")

  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.45">
    <h2 style="margin:0 0 8px 0;">Bestellbestätigung ${escapeHtml(orderNumber)}</h2>
    <p style="margin:0 0 14px 0;">Danke${name ? " " + escapeHtml(name) : ""}! Wir haben deine Bestellung erhalten und bearbeiten sie jetzt.</p>

    <table style="width:100%; border-collapse:collapse; margin:14px 0;">
      <thead>
        <tr>
          <th align="left" style="border-bottom:1px solid #eee; padding:6px 0;">Artikel</th>
          <th align="right" style="border-bottom:1px solid #eee; padding:6px 0;">Menge</th>
          <th align="right" style="border-bottom:1px solid #eee; padding:6px 0;">Preis</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top:10px;">
      <div style="display:flex; justify-content:space-between;"><span>Zwischensumme</span><strong>${subtotal} €</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>Versand</span><strong>${shipping} €</strong></div>
      <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:18px;">
        <span>Gesamt</span><strong>${total} €</strong>
      </div>
    </div>

    <p style="margin:14px 0 0 0; color:#666; font-size:12px;">
      Zahlung: PayPal · Bestellnummer: ${escapeHtml(orderNumber)}
    </p>
  </div>`
}

function buildAdminOrderEmailHtml(order: any) {
  const orderNumber = order?.orderNumber || order?._id
  const subtotal = money(order?.subtotal)
  const shipping = money(order?.shippingCost)
  const total = money(order?.amountTotal ?? order?.total)
  const items: any[] = Array.isArray(order?.items) ? order.items : []

  const itemsHtml = items
    .map((it) => {
      const title = escapeHtml(it?.title)
      const sku = escapeHtml(it?.sku || "")
      const qty = escapeHtml(it?.quantity)
      const unit = money(it?.unitPrice)
      return `<tr>
        <td style="padding:6px 0;">${title}${sku ? ` <span style="color:#666">(${sku})</span>` : ""}</td>
        <td style="padding:6px 0; text-align:right;">${qty}×</td>
        <td style="padding:6px 0; text-align:right;">${unit} €</td>
      </tr>`
    })
    .join("")

  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.45">
    <h2 style="margin:0 0 8px 0;">Neue Bestellung ${escapeHtml(orderNumber)}</h2>

    <p style="margin:0 0 12px 0;">
      <strong>Kunde:</strong> ${escapeHtml(order?.customerName || "—")}<br/>
      <strong>E-Mail:</strong> ${escapeHtml(order?.customerEmail || "—")}<br/>
      <strong>Telefon:</strong> ${escapeHtml(order?.customerPhone || "—")}<br/>
      <strong>Zahlung:</strong> PayPal
    </p>

    <table style="width:100%; border-collapse:collapse; margin:14px 0;">
      <thead>
        <tr>
          <th align="left" style="border-bottom:1px solid #eee; padding:6px 0;">Artikel</th>
          <th align="right" style="border-bottom:1px solid #eee; padding:6px 0;">Menge</th>
          <th align="right" style="border-bottom:1px solid #eee; padding:6px 0;">Preis</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div style="margin-top:10px;">
      <div style="display:flex; justify-content:space-between;"><span>Zwischensumme</span><strong>${subtotal} €</strong></div>
      <div style="display:flex; justify-content:space-between;"><span>Versand</span><strong>${shipping} €</strong></div>
      <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:18px;">
        <span>Gesamt</span><strong>${total} €</strong>
      </div>
    </div>
  </div>`
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