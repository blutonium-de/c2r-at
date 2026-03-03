import {NextResponse} from "next/server"
import Stripe from "stripe"
import {createClient} from "@sanity/client"
import {apiVersion, dataset, projectId} from "@/sanity/env"

export const runtime = "nodejs"

function toMoneyFromCents(cents: any) {
  const n = typeof cents === "number" ? cents : Number(cents)
  if (!Number.isFinite(n)) return null
  return Math.round(n) / 100
}

async function sendOrderEmailResend(args: {to: string; subject: string; html: string}) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM
  if (!key) throw new Error("RESEND_API_KEY fehlt")
  if (!from) throw new Error('MAIL_FROM fehlt (z.B. "c2r.at <noreply@c2r.at>")')

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({from, to: args.to, subject: args.subject, html: args.html}),
  })

  const j = await r.json().catch(() => ({} as any))
  if (!r.ok) throw new Error(`Resend send failed: ${j?.message || JSON.stringify(j)}`)
  return j
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
function buildOrderEmailHtml(order: any) {
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
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height:1.4">
    <h2 style="margin:0 0 8px 0;">Bestellbestätigung ${escapeHtml(orderNumber)}</h2>
    <p style="margin:0 0 14px 0;">Danke${name ? " " + escapeHtml(name) : ""}! Wir haben deine Bestellung erhalten.</p>

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
      Zahlung: Stripe · Bestellnummer: ${escapeHtml(orderNumber)}
    </p>
  </div>`
}

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const writeToken = process.env.SANITY_API_WRITE_TOKEN

    if (!stripeSecret) return NextResponse.json({error: "STRIPE_SECRET_KEY fehlt"}, {status: 500})
    if (!webhookSecret) return NextResponse.json({error: "STRIPE_WEBHOOK_SECRET fehlt"}, {status: 500})
    if (!writeToken) return NextResponse.json({error: "SANITY_API_WRITE_TOKEN fehlt"}, {status: 500})

    const stripe = new Stripe(stripeSecret as string)

    const sig = req.headers.get("stripe-signature")
    if (!sig) return NextResponse.json({error: "Missing stripe-signature"}, {status: 400})

    const rawBody = await req.text()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err: any) {
      return NextResponse.json({error: "Invalid signature", details: err?.message ?? String(err)}, {status: 400})
    }

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion,
      token: writeToken,
      useCdn: false,
    })

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = (session?.metadata as any)?.orderId as string | undefined

      if (!orderId) {
        console.warn("Stripe webhook: missing metadata.orderId", session?.id)
        return NextResponse.json({ok: true, warning: "missing orderId"})
      }

      const currency = (session?.currency ?? "eur").toUpperCase()
      const amountTotal = toMoneyFromCents((session as any)?.amount_total)

      const customerEmail = session?.customer_details?.email ?? (session as any)?.customer_email ?? undefined
      const customerName = session?.customer_details?.name ?? undefined

      await writeClient
        .patch(orderId)
        .set({
          status: "paid",
          provider: "stripe",
          stripeSessionId: session.id,
          providerOrderId: session.id,
          currency,
          amountTotal: typeof amountTotal === "number" ? amountTotal : undefined,
          customerEmail,
          customerName,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .commit({autoGenerateArrayKeys: true})

      // ✅ E-Mail senden (nachdem paid gesetzt ist)
      try {
        const order = await writeClient.getDocument(String(orderId))
        const to = order?.customerEmail
        if (to) {
          const subject = `Bestellbestätigung ${order?.orderNumber || order?._id}`
          const html = buildOrderEmailHtml(order)
          await sendOrderEmailResend({to, subject, html})

          await writeClient.patch(String(orderId)).set({customerEmailSentAt: new Date().toISOString()}).commit()
        }
      } catch (mailErr) {
        console.error("Stripe order email failed:", mailErr)
      }

      return NextResponse.json({ok: true})
    }

    return NextResponse.json({ok: true})
  } catch (err: any) {
    return NextResponse.json({error: "Webhook error", details: err?.message ?? String(err)}, {status: 500})
  }
}