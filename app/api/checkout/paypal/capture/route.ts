import {NextResponse} from "next/server"
import {createClient} from "@sanity/client"
import {apiVersion, dataset, projectId} from "@/sanity/env"

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
      return NextResponse.json({ok: false, error: "PayPal capture failed", details: cap}, {status: 400})
    }

    // custom_id enthält unsere Sanity Order ID (aus create order)
    const sanityOrderId = cap?.purchase_units?.[0]?.custom_id || null

    const currency = cap?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code || "EUR"
    const amountStr = cap?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
    const amountTotal = typeof amountStr === "string" ? Number(amountStr) : null

    if (sanityOrderId) {
      await writeClient
        .patch(String(sanityOrderId))
        .set({
          status: "paid",
          provider: "paypal",
          providerOrderId: paypalOrderId,
          currency,
          amountTotal: typeof amountTotal === "number" && Number.isFinite(amountTotal) ? amountTotal : undefined,
          paidAt: new Date().toISOString(),
        })
        .commit()
    } else {
      // fallback: über providerOrderId suchen
      const existing = await writeClient.fetch(
        `*[_type=="order" && provider=="paypal" && providerOrderId==$id][0]{_id}`,
        {id: paypalOrderId}
      )

      if (existing?._id) {
        await writeClient
          .patch(existing._id)
          .set({
            status: "paid",
            provider: "paypal",
            providerOrderId: paypalOrderId,
            currency,
            amountTotal: typeof amountTotal === "number" && Number.isFinite(amountTotal) ? amountTotal : undefined,
            paidAt: new Date().toISOString(),
          })
          .commit()
      }
    }

    return NextResponse.json({ok: true})
  } catch (err: any) {
    return NextResponse.json({ok: false, error: err?.message ?? String(err)}, {status: 500})
  }
}