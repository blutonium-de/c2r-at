import {NextResponse} from "next/server"
import {client} from "@/sanity/lib/client"

type CartItem = {productId: string; qty: number}

const SANITY_PRODUCTS_QUERY = `*[_type=="product" && _id in $ids]{
  _id, title, price
}`

function getPayPalBaseUrl() {
  const mode = process.env.PAYPAL_MODE?.toLowerCase()
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

async function getAccessToken() {
  const base = getPayPalBaseUrl()
  const id = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!id || !secret) throw new Error("PayPal ENV fehlt (ClientID/Secret).")

  const auth = Buffer.from(`${id}:${secret}`).toString("base64")

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json?.error_description || "PayPal Token Fehler")
  return json.access_token as string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {items?: CartItem[]}
    const items = Array.isArray(body?.items) ? body.items : []
    if (!items.length) return NextResponse.json({error: "Warenkorb leer."}, {status: 400})

    const ids = items.map((x) => x.productId)
    const products = await client.fetch(SANITY_PRODUCTS_QUERY, {ids}, {perspective: "published"})

    // Preise server-seitig berechnen (anti-tampering)
    const lines = items
      .map((i) => {
        const p = products?.find((x: any) => x?._id === i.productId)
        const price = typeof p?.price === "number" ? p.price : null
        const qty = typeof i.qty === "number" ? Math.max(1, Math.floor(i.qty)) : 1
        if (!p || price === null) return null
        return {id: p._id, name: p.title, unit: price, qty}
      })
      .filter(Boolean) as Array<{id: string; name: string; unit: number; qty: number}>

    if (!lines.length) return NextResponse.json({error: "Keine gültigen Produkte im Warenkorb."}, {status: 400})

    const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0)
    const value = (Math.round(subtotal * 100) / 100).toFixed(2)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) return NextResponse.json({error: "NEXT_PUBLIC_SITE_URL fehlt."}, {status: 500})

    const accessToken = await getAccessToken()
    const base = getPayPalBaseUrl()

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value,
            },
          },
        ],
        application_context: {
          brand_name: "c2r.at",
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/cart/success`,
          cancel_url: `${siteUrl}/cart/cancel`,
        },
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({error: json?.message || "PayPal Order create failed", details: json}, {status: 400})
    }

    const approve = Array.isArray(json?.links) ? json.links.find((l: any) => l?.rel === "approve") : null
    return NextResponse.json({
      orderId: json?.id,
      approveUrl: approve?.href,
    })
  } catch (e: any) {
    return NextResponse.json({error: e?.message || "Server error"}, {status: 500})
  }
}