import {NextResponse} from "next/server"
import Stripe from "stripe"
import {createClient} from "@sanity/client"
import {apiVersion, dataset, projectId} from "@/sanity/env"
import {client as readClient} from "@/sanity/lib/client"
import {randomUUID} from "crypto"

export const runtime = "nodejs"

type Body =
  | {
      action: "quote"
      region: "AT" | "EU"
      items: {productId: string; qty: number}[]
    }
  | {
      action: "create"
      provider: "stripe" | "paypal"
      region: "AT" | "EU"
      shippingProfileId: string
      customer: {
        email: string
        phone?: string | null
        fullName: string
        isBusiness?: boolean
        companyName?: string | null
        vatId?: string | null
      }
      shippingAddress: {
        fullName: string
        line1: string
        postalCode: string
        city: string
        country: string
      }
      items: {productId: string; qty: number}[]
    }

const productsQuery = `*[_type=="product" && _id in $ids]{
  _id,
  title,
  price,
  sku,
  deliveryTimeLabel,
  shippingNote,
  shippingProfiles[]->{
    _id,
    title,
    region,
    shippingClass,
    price,
    freeFrom,
    isActive
  }
}`

function toInt(n: any, fallback = 1) {
  const x = Number(n)
  if (!Number.isFinite(x) || x <= 0) return fallback
  return Math.floor(x)
}

function makeOrderNumber() {
  return `C2R-${Date.now()}`
}

function money(n: number) {
  return Math.round(n * 100) / 100
}

// Preise sind BRUTTO (inkl. MwSt.) → MwSt-Anteil herausrechnen (MVP 20%)
const VAT_RATE = 0.2
function calcIncludedVat(totalGross: number) {
  const vat = totalGross - totalGross / (1 + VAT_RATE)
  return money(vat)
}

// ✅ Versandklassen-Ranking (für “größte gewinnt”)
const CLASS_RANK: Record<string, number> = {small: 1, medium: 2, large: 3}
function classRank(c: any) {
  return CLASS_RANK[String(c)] ?? 999
}

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
    const body = (await req.json()) as Body

    // --------- validate items ----------
    const items = (body as any)?.items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ok: false, error: "Warenkorb ist leer."}, {status: 400})
    }

    const ids = items.map((x: any) => x.productId).filter(Boolean)
    const products = await readClient.fetch(productsQuery, {ids}, {perspective: "published"})

    const byId = new Map<string, any>()
    for (const p of products ?? []) byId.set(p._id, p)

    const normalized = items
      .map((x: any) => {
        const p = byId.get(x.productId)
        const qty = toInt(x.qty, 1)
        if (!p) return null
        if (typeof p?.price !== "number") return null
        return {product: p, qty}
      })
      .filter(Boolean) as {product: any; qty: number}[]

    if (!normalized.length) {
      return NextResponse.json({ok: false, error: "Keine gültigen Produkte im Warenkorb."}, {status: 400})
    }

    const subtotal = money(normalized.reduce((sum, x) => sum + x.product.price * x.qty, 0))

    // --------- shipping options (largest class wins) ----------
    const region = (body as any)?.region as "AT" | "EU"

    // pro Produkt: aktive Profile die zur Region passen
    const perProductProfilesExpanded = normalized.map(({product}) => {
      const arr = Array.isArray(product?.shippingProfiles) ? product.shippingProfiles : []
      const active = arr.filter((s: any) => s?.isActive !== false)
      const matching = active.filter((s: any) => s?.region === region)
      return matching
    })

    if (perProductProfilesExpanded.some((list) => list.length === 0)) {
      return NextResponse.json(
        {ok: false, error: "Mindestens ein Produkt hat keine passenden Versandprofile (AT/EU)."},
        {status: 400}
      )
    }

    // ✅ größte benötigte shippingClass gewinnt
    const requiredRank = Math.max(
      ...perProductProfilesExpanded.map((list) => {
        const minRank = Math.min(...list.map((sp: any) => classRank(sp?.shippingClass)))
        return minRank
      })
    )

    // alle Profile aus allen Produkten sammeln
    const allProfilesExpanded = new Map<string, any>()
    for (const list of perProductProfilesExpanded) {
      for (const sp of list) allProfilesExpanded.set(String(sp._id), sp)
    }

    // ✅ Optionen: alles, was groß genug ist
    const shippingOptions = [...allProfilesExpanded.values()]
      .filter((sp: any) => classRank(sp?.shippingClass) >= requiredRank)
      .map((sp: any) => {
        const price = typeof sp.price === "number" ? sp.price : 0
        const freeFrom = typeof sp.freeFrom === "number" ? sp.freeFrom : null
        const cost = freeFrom !== null && subtotal >= freeFrom ? 0 : price
        return {
          id: String(sp._id),
          title: String(sp.title ?? "Versand"),
          region: sp.region as "AT" | "EU",
          shippingClass: sp.shippingClass as "small" | "medium" | "large",
          price: money(price),
          freeFrom,
          cost: money(cost),
        }
      })

    shippingOptions.sort((a, b) => a.cost - b.cost)

    const selectedShippingId = shippingOptions[0]?.id ?? null
    const shippingCost = selectedShippingId
      ? shippingOptions.find((x: any) => x.id === selectedShippingId)?.cost ?? 0
      : 0

    const total = money(subtotal + shippingCost)
    const tax = calcIncludedVat(total)

    const labels = normalized
      .map(({product}) => String(product?.deliveryTimeLabel ?? "").trim())
      .filter(Boolean)
    const deliveryHint = labels.length ? `Lieferzeit (Hinweis): ${labels.join(" · ")}` : null

    // --------- QUOTE ----------
    if ((body as any).action === "quote") {
      return NextResponse.json({
        ok: true,
        currency: "EUR",
        subtotal,
        shippingOptions,
        selectedShippingId,
        shippingCost,
        tax,
        vatRate: VAT_RATE,
        total,
        deliveryHint,
      })
    }

    // --------- CREATE ----------
    if ((body as any).action === "create") {
      const b = body as Extract<Body, {action: "create"}>

      if (!b?.provider) return NextResponse.json({ok: false, error: "Provider fehlt."}, {status: 400})
      if (!b?.shippingProfileId) return NextResponse.json({ok: false, error: "Versandart fehlt."}, {status: 400})
      if (!b?.customer?.email) return NextResponse.json({ok: false, error: "E-Mail fehlt."}, {status: 400})
      if (!b?.customer?.fullName) return NextResponse.json({ok: false, error: "Name fehlt."}, {status: 400})
      if (!b?.shippingAddress?.line1) return NextResponse.json({ok: false, error: "Adresse fehlt."}, {status: 400})
      if (!b?.shippingAddress?.postalCode || !b?.shippingAddress?.city) {
        return NextResponse.json({ok: false, error: "PLZ/Ort fehlt."}, {status: 400})
      }

      const chosen = shippingOptions.find((x: any) => x.id === b.shippingProfileId)
      if (!chosen) {
        return NextResponse.json({ok: false, error: "Ungültige Versandart."}, {status: 400})
      }

      const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

      const writeToken = process.env.SANITY_API_WRITE_TOKEN
      if (!writeToken) {
        return NextResponse.json({ok: false, error: "SANITY_API_WRITE_TOKEN fehlt in .env.local"}, {status: 500})
      }

      const writeClient = createClient({
        projectId,
        dataset,
        apiVersion,
        token: writeToken,
        useCdn: false,
      })

      // 1) create order (NEW / pending)
      const orderNumber = makeOrderNumber()

      const orderDoc: any = {
        _type: "order",
        status: "new",
        provider: b.provider,
        providerOrderId: undefined,

        currency: "EUR",

        orderNumber,
        subtotal,
        shippingCost: chosen.cost,
        tax,
        amountTotal: total,

        customerName: b.customer.fullName,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phone ?? undefined,

        isBusiness: !!b.customer.isBusiness,
        companyName: b.customer.companyName ?? undefined,
        vatId: b.customer.vatId ?? undefined,

        shippingProfile: {_type: "reference", _ref: chosen.id},
        shippingProfileName: chosen.title,

        items: normalized.map(({product, qty}) => ({
          _key: randomUUID(),
          title: product.title,
          sku: product.sku,
          quantity: qty,
          unitPrice: product.price,
          product: {_type: "reference", _ref: product._id},
        })),

        shippingAddress: {
          line1: b.shippingAddress.line1,
          line2: undefined,
          postalCode: b.shippingAddress.postalCode,
          city: b.shippingAddress.city,
          country: b.shippingAddress.country,
        },

        createdAt: new Date().toISOString(),
      }

      const created = await writeClient.create(orderDoc)
      const orderId = created._id as string

      // 2) Provider create
      if (b.provider === "stripe") {
        if (!process.env.STRIPE_SECRET_KEY) {
          return NextResponse.json({ok: false, error: "STRIPE_SECRET_KEY fehlt in .env.local"}, {status: 500})
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: b.customer.email,
          line_items: [
            ...normalized.map(({product, qty}) => ({
              quantity: qty,
              price_data: {
                currency: "eur",
                unit_amount: Math.round(product.price * 100),
                product_data: {
                  name: product.title,
                  metadata: {sanityProductId: product._id},
                },
              },
            })),
            {
              quantity: 1,
              price_data: {
                currency: "eur",
                unit_amount: Math.round(chosen.cost * 100),
                product_data: {name: `Versand: ${chosen.title}`},
              },
            },
          ],
          success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/checkout`,
          metadata: {source: "c2r-shop", orderId},
        })

        await writeClient
          .patch(orderId)
          .set({
            providerOrderId: session.id,
            stripeSessionId: session.id,
          })
          .commit()

        return NextResponse.json({ok: true, url: session.url})
      }

      if (b.provider === "paypal") {
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
          return NextResponse.json(
            {ok: false, error: "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET fehlt in .env.local"},
            {status: 500}
          )
        }

        const accessToken = await getPayPalAccessToken()
        const currency = (process.env.PAYPAL_CURRENCY || "EUR").toUpperCase()

        const totalStr = total.toFixed(2)
        const subtotalStr = subtotal.toFixed(2)
        const shippingStr = chosen.cost.toFixed(2)

        const createRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                reference_id: orderId, // ✅ wichtig (sonst manchmal "default")
                custom_id: orderId, // ✅ bleibt (zweiter stabiler Weg)
                amount: {
                  currency_code: currency,
                  value: totalStr,
                  breakdown: {
                    item_total: {currency_code: currency, value: subtotalStr},
                    shipping: {currency_code: currency, value: shippingStr},
                  },
                },
                items: normalized.map(({product, qty}) => ({
                  name: String(product.title ?? "Artikel").slice(0, 127),
                  unit_amount: {currency_code: currency, value: Number(product.price).toFixed(2)},
                  quantity: String(qty),
                  sku: product.sku ? String(product.sku).slice(0, 127) : undefined,
                })),
              },
            ],
            application_context: {
              shipping_preference: "NO_SHIPPING",
              user_action: "PAY_NOW",
              return_url: `${origin}/checkout/success?paypal=1`,
              cancel_url: `${origin}/checkout`,
            },
          }),
        })

        const createdPaypal = await createRes.json().catch(() => ({} as any))
        if (!createRes.ok) {
          return NextResponse.json(
            {ok: false, error: "PayPal create order failed", details: createdPaypal},
            {status: 500}
          )
        }

        const paypalOrderId = createdPaypal?.id
        const approveUrl = Array.isArray(createdPaypal?.links)
          ? createdPaypal.links.find((l: any) => l?.rel === "approve")?.href
          : null

        if (!paypalOrderId || !approveUrl) {
          return NextResponse.json({ok: false, error: "PayPal approveUrl fehlt", details: createdPaypal}, {status: 500})
        }

        await writeClient
          .patch(orderId)
          .set({
            provider: "paypal",
            providerOrderId: paypalOrderId,
          })
          .commit()

        return NextResponse.json({ok: true, approveUrl})
      }

      return NextResponse.json({ok: false, error: "Unbekannter Provider."}, {status: 400})
    }

    return NextResponse.json({ok: false, error: "Ungültige Action."}, {status: 400})
  } catch (err: any) {
    return NextResponse.json(
      {ok: false, error: "Checkout-Fehler.", details: err?.message ?? String(err)},
      {status: 500}
    )
  }
}