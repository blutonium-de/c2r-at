import {NextResponse} from "next/server"
import {createClient} from "@sanity/client"
import {apiVersion, dataset, projectId} from "@/sanity/env"

export const runtime = "nodejs"

function getPayPalBase() {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase()
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) throw new Error("PayPal env fehlt (Client ID / Secret).")

  const base = getPayPalBase()
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const json: any = await res.json().catch(() => ({}))
  if (!res.ok || !json?.access_token) throw new Error("PayPal Auth failed")
  return json.access_token as string
}

function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error("SANITY_API_WRITE_TOKEN fehlt")

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })
}

export async function POST(req: Request) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) return NextResponse.json({error: "PAYPAL_WEBHOOK_ID fehlt."}, {status: 500})

    const rawBody = await req.text()
    const event = JSON.parse(rawBody)

    // ✅ Signature verify (PayPal fordert das)
    const transmissionId = req.headers.get("paypal-transmission-id")
    const transmissionTime = req.headers.get("paypal-transmission-time")
    const certUrl = req.headers.get("paypal-cert-url")
    const authAlgo = req.headers.get("paypal-auth-algo")
    const transmissionSig = req.headers.get("paypal-transmission-sig")

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      return NextResponse.json({error: "PayPal headers fehlen (verify)."}, {status: 400})
    }

    const base = getPayPalBase()
    const accessToken = await getPayPalAccessToken()

    const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    })

    const verifyJson: any = await verifyRes.json().catch(() => ({}))
    if (!verifyRes.ok || verifyJson?.verification_status !== "SUCCESS") {
      return NextResponse.json({error: "PayPal signature verify failed", details: verifyJson}, {status: 400})
    }

    // ✅ Events, die wir interessieren
    const type = event?.event_type as string | undefined

    // Wir setzen "paid" bei CAPTURE.COMPLETED
    if (type === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event?.resource ?? {}
      const paypalCaptureId = resource?.id ?? null
      const paypalOrderId =
        resource?.supplementary_data?.related_ids?.order_id ??
        resource?.supplementary_data?.related_ids?.checkout_id ??
        null

      const amount = resource?.amount?.value ? Number(resource.amount.value) : null
      const currency = resource?.amount?.currency_code ?? "EUR"
      const payerEmail = resource?.payer?.email_address ?? null

      const writeClient = getWriteClient()

      const existing = await writeClient.fetch(
        `*[_type=="order" && (paypalOrderId==$poid || providerOrderId==$poid)][0]{_id,status}`,
        {poid: paypalOrderId}
      )

      if (existing?._id && existing.status !== "paid") {
        await writeClient
          .patch(existing._id)
          .set({
            status: "paid",
            provider: "paypal",
            providerOrderId: paypalOrderId ?? undefined,
            paypalOrderId: paypalOrderId ?? undefined,
            paypalCaptureId: paypalCaptureId ?? undefined,
            currency: currency?.toUpperCase?.() ?? "EUR",
            amountTotal: typeof amount === "number" ? amount : undefined,
            customerEmail: payerEmail ?? undefined,
            paidAt: new Date().toISOString(),
          })
          .commit()
      }
    }

    return NextResponse.json({ok: true})
  } catch (err: any) {
    return NextResponse.json(
      {error: "PayPal webhook error", details: err?.message ?? String(err)},
      {status: 500}
    )
  }
}