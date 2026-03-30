import {NextResponse} from "next/server"
import Stripe from "stripe"
import {createClient} from "@sanity/client"
import {apiVersion, dataset, projectId} from "@/sanity/env"
import {client as readClient} from "@/sanity/lib/client"
import {randomUUID} from "crypto"

export const runtime = "nodejs"

type CustomerInput = {
  email?: string
  phone?: string | null
  fullName?: string
  isBusiness?: boolean
  isCompany?: boolean
  companyName?: string | null
  vatId?: string | null
}

type Body =
  | {
      action: "quote"
      region: "AT" | "EU"
      customer?: CustomerInput
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
        isCompany?: boolean
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

const VAT_RATE = 0.2

function calcIncludedVat(totalGross: number) {
  const vat = totalGross - totalGross / (1 + VAT_RATE)
  return money(vat)
}

function grossToNet(gross: number) {
  return money(gross / (1 + VAT_RATE))
}

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

type VatValidationResult = {
  valid: boolean
  countryCode: string | null
  vatNumber: string | null
  name: string | null
  address: string | null
  message: string | null
  unavailable?: boolean
}

function normalizeVatId(input: any) {
  return String(input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function decodeXml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

function extractXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"))
  return match ? decodeXml(match[1]).trim() : null
}

async function validateEuVatId(vatIdRaw: string): Promise<VatValidationResult> {
  const vatId = normalizeVatId(vatIdRaw)
  if (!vatId || vatId.length < 3) {
    return {
      valid: false,
      countryCode: null,
      vatNumber: null,
      name: null,
      address: null,
      message: "Bitte eine gültige UID / VAT ID eingeben.",
    }
  }

  const countryCode = vatId.slice(0, 2)
  const vatNumber = vatId.slice(2)

  if (!/^[A-Z]{2}$/.test(countryCode) || !vatNumber) {
    return {
      valid: false,
      countryCode: null,
      vatNumber: null,
      name: null,
      address: null,
      message: "Format der UID / VAT ID ist ungültig.",
    }
  }

  if (countryCode === "AT") {
    return {
      valid: false,
      countryCode,
      vatNumber,
      name: null,
      address: null,
      message: "AT-UID führt nicht zu einer umsatzsteuerfreien innergemeinschaftlichen Lieferung.",
    }
  }

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns1="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Body>
    <tns1:checkVat>
      <tns1:countryCode>${countryCode}</tns1:countryCode>
      <tns1:vatNumber>${vatNumber}</tns1:vatNumber>
    </tns1:checkVat>
  </soap:Body>
</soap:Envelope>`

  const endpoints = [
    "https://ec.europa.eu/taxation_customs/vies/services/checkVatService",
    "https://ec.europa.eu/taxation_customs/vies/checkVatService",
  ]

  let lastError = ""

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "",
        },
        body: envelope,
        cache: "no-store",
      })

      const xml = await res.text()

      const fault = extractXmlTag(xml, "faultstring")
      if (fault) {
        lastError = fault
        continue
      }

      const valid = extractXmlTag(xml, "valid") === "true"
      const name = extractXmlTag(xml, "name")
      const address = extractXmlTag(xml, "address")

      if (valid) {
        return {
          valid: true,
          countryCode,
          vatNumber,
          name: name && name !== "---" ? name : null,
          address: address && address !== "---" ? address : null,
          message: "UID erfolgreich geprüft.",
        }
      }

      return {
        valid: false,
        countryCode,
        vatNumber,
        name: null,
        address: null,
        message: "UID ist ungültig oder nicht für innergemeinschaftliche Lieferungen freigeschaltet.",
      }
    } catch (err: any) {
      lastError = err?.message ?? String(err)
    }
  }

  return {
    valid: false,
    countryCode,
    vatNumber,
    name: null,
    address: null,
    message: "UID-Prüfung momentan nicht verfügbar. Bestellung bleibt vorerst brutto.",
    unavailable: true,
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

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
        const grossUnitPrice = money(Number(p.price))
        const netUnitPrice = grossToNet(grossUnitPrice)
        return {product: p, qty, grossUnitPrice, netUnitPrice}
      })
      .filter(Boolean) as {product: any; qty: number; grossUnitPrice: number; netUnitPrice: number}[]

    if (!normalized.length) {
      return NextResponse.json({ok: false, error: "Keine gültigen Produkte im Warenkorb."}, {status: 400})
    }

    const grossSubtotal = money(normalized.reduce((sum, x) => sum + x.grossUnitPrice * x.qty, 0))
    const netSubtotal = money(normalized.reduce((sum, x) => sum + x.netUnitPrice * x.qty, 0))

    const region = (body as any)?.region as "AT" | "EU"

    const customer = (body as any)?.customer ?? {}
    const isBusiness = !!(customer?.isBusiness || customer?.isCompany)
    const companyName = String(customer?.companyName ?? "").trim() || null
    const vatId = String(customer?.vatId ?? "").trim() || null

    let vatValidation: VatValidationResult = {
      valid: false,
      countryCode: null,
      vatNumber: null,
      name: null,
      address: null,
      message: null,
    }

    if (region === "EU" && isBusiness && vatId) {
      vatValidation = await validateEuVatId(vatId)
    }

    const reverseChargeApplied = region === "EU" && isBusiness && !!vatId && vatValidation.valid && vatValidation.countryCode !== "AT"

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

    const requiredRank = Math.max(
      ...perProductProfilesExpanded.map((list) => {
        const minRank = Math.min(...list.map((sp: any) => classRank(sp?.shippingClass)))
        return minRank
      })
    )

    const allProfilesExpanded = new Map<string, any>()
    for (const list of perProductProfilesExpanded) {
      for (const sp of list) allProfilesExpanded.set(String(sp._id), sp)
    }

    const shippingOptions = [...allProfilesExpanded.values()]
      .filter((sp: any) => classRank(sp?.shippingClass) >= requiredRank)
      .map((sp: any) => {
        const priceGross = typeof sp.price === "number" ? money(sp.price) : 0
        const freeFrom = typeof sp.freeFrom === "number" ? sp.freeFrom : null
        const costGross = freeFrom !== null && grossSubtotal >= freeFrom ? 0 : priceGross
        const cost = reverseChargeApplied ? grossToNet(costGross) : costGross

        return {
          id: String(sp._id),
          title: String(sp.title ?? "Versand"),
          region: sp.region as "AT" | "EU",
          shippingClass: sp.shippingClass as "small" | "medium" | "large",
          price: reverseChargeApplied ? grossToNet(priceGross) : priceGross,
          freeFrom,
          cost: money(cost),
          costGross: money(costGross),
        }
      })

    shippingOptions.sort((a, b) => a.cost - b.cost)

    const selectedShippingId = shippingOptions[0]?.id ?? null
    const selectedShipping = selectedShippingId
      ? shippingOptions.find((x: any) => x.id === selectedShippingId) ?? null
      : null

    const shippingCost = selectedShipping ? selectedShipping.cost : 0
    const shippingCostGross = selectedShipping ? selectedShipping.costGross : 0

    const subtotal = reverseChargeApplied ? netSubtotal : grossSubtotal
    const total = money(subtotal + shippingCost)
    const totalGross = money(grossSubtotal + shippingCostGross)
    const tax = reverseChargeApplied ? 0 : calcIncludedVat(total)

    const labels = normalized
      .map(({product}) => String(product?.deliveryTimeLabel ?? "").trim())
      .filter(Boolean)
    const deliveryHint = labels.length ? `Lieferzeit (Hinweis): ${labels.join(" · ")}` : null

    if ((body as any).action === "quote") {
      return NextResponse.json({
        ok: true,
        currency: "EUR",
        subtotal,
        subtotalGross: grossSubtotal,
        shippingOptions: shippingOptions.map((x: any) => ({
          id: x.id,
          title: x.title,
          region: x.region,
          shippingClass: x.shippingClass,
          price: x.price,
          freeFrom: x.freeFrom,
          cost: x.cost,
        })),
        selectedShippingId,
        shippingCost,
        shippingCostGross,
        tax,
        vatRate: reverseChargeApplied ? 0 : VAT_RATE,
        total,
        totalGross,
        deliveryHint,
        reverseChargeApplied,
        vatValidated: vatValidation.valid,
        vatValidationMessage: vatValidation.message,
        vatCompanyName: vatValidation.name,
        vatCompanyAddress: vatValidation.address,
      })
    }

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

      if (region === "EU" && isBusiness && !vatId) {
        return NextResponse.json({ok: false, error: "Für EU-Firmenkunden bitte eine UID / VAT ID eingeben."}, {status: 400})
      }

      const chosen = shippingOptions.find((x: any) => x.id === b.shippingProfileId)
      if (!chosen) {
        return NextResponse.json({ok: false, error: "Ungültige Versandart."}, {status: 400})
      }

      const finalShippingCost = chosen.cost
      const finalShippingCostGross = chosen.costGross
      const finalSubtotal = reverseChargeApplied ? netSubtotal : grossSubtotal
      const finalTotal = money(finalSubtotal + finalShippingCost)
      const finalTotalGross = money(grossSubtotal + finalShippingCostGross)
      const finalTax = reverseChargeApplied ? 0 : calcIncludedVat(finalTotal)

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

      const orderNumber = makeOrderNumber()

      const orderDoc: any = {
        _type: "order",
        status: "new",
        provider: b.provider,
        providerOrderId: undefined,

        currency: "EUR",

        orderNumber,
        subtotal: finalSubtotal,
        subtotalGross: grossSubtotal,
        shippingCost: finalShippingCost,
        shippingCostGross: finalShippingCostGross,
        tax: finalTax,
        taxRateApplied: reverseChargeApplied ? 0 : VAT_RATE,
        amountTotal: finalTotal,
        amountTotalGross: finalTotalGross,
        reverseChargeApplied,
        taxExemptReason: reverseChargeApplied ? "Innergemeinschaftliche Lieferung – umsatzsteuerfrei" : undefined,

        customerName: b.customer.fullName,
        customerEmail: b.customer.email,
        customerPhone: b.customer.phone ?? undefined,

        isBusiness: isBusiness,
        companyName: companyName ?? undefined,
        vatId: vatId ?? undefined,
        vatValidated: vatValidation.valid,
        vatValidationMessage: vatValidation.message ?? undefined,
        vatValidatedAt: vatId ? new Date().toISOString() : undefined,
        vatCompanyName: vatValidation.name ?? undefined,
        vatCompanyAddress: vatValidation.address ?? undefined,

        shippingProfile: {_type: "reference", _ref: chosen.id},
        shippingProfileName: chosen.title,

        items: normalized.map(({product, qty, grossUnitPrice, netUnitPrice}) => ({
          _key: randomUUID(),
          title: product.title,
          sku: product.sku,
          quantity: qty,
          unitPrice: reverseChargeApplied ? netUnitPrice : grossUnitPrice,
          unitPriceGross: grossUnitPrice,
          unitPriceNet: netUnitPrice,
          deliveryTimeLabel: product.deliveryTimeLabel ?? undefined,
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

      if (b.provider === "stripe") {
        if (!process.env.STRIPE_SECRET_KEY) {
          return NextResponse.json({ok: false, error: "STRIPE_SECRET_KEY fehlt in .env.local"}, {status: 500})
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: b.customer.email,
          line_items: [
            ...normalized.map(({product, qty, grossUnitPrice, netUnitPrice}) => ({
              quantity: qty,
              price_data: {
                currency: "eur",
                unit_amount: Math.round((reverseChargeApplied ? netUnitPrice : grossUnitPrice) * 100),
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
          metadata: {
            source: "c2r-shop",
            orderId,
            reverseChargeApplied: reverseChargeApplied ? "true" : "false",
            vatId: vatId ?? "",
          },
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

        const totalStr = finalTotal.toFixed(2)
        const subtotalStr = finalSubtotal.toFixed(2)
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
                reference_id: orderId,
                custom_id: orderId,
                amount: {
                  currency_code: currency,
                  value: totalStr,
                  breakdown: {
                    item_total: {currency_code: currency, value: subtotalStr},
                    shipping: {currency_code: currency, value: shippingStr},
                  },
                },
                items: normalized.map(({product, qty, grossUnitPrice, netUnitPrice}) => ({
                  name: String(product.title ?? "Artikel").slice(0, 127),
                  unit_amount: {
                    currency_code: currency,
                    value: (reverseChargeApplied ? netUnitPrice : grossUnitPrice).toFixed(2),
                  },
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