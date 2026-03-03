import {NextResponse} from "next/server"
import {client as readClient} from "@/sanity/lib/client"

export const runtime = "nodejs"

type Body = {
  items: {productId: string; qty: number}[]
  country: "AT" | "EU"
}

const productsQuery = `*[_type=="product" && _id in $ids]{
  _id,
  title,
  price,
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

function pickDefault(options: any[]) {
  if (!options.length) return null
  const gls = options.filter((o) => String(o.title || "").toLowerCase().includes("gls"))
  const base = gls.length ? gls : options
  base.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))
  return base[0]
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ok: false, error: "Warenkorb ist leer."}, {status: 400})
    }

    const country = body.country === "AT" ? "AT" : "EU"
    const ids = body.items.map((x) => x.productId).filter(Boolean)

    const products = await readClient.fetch(productsQuery, {ids}, {perspective: "published"})

    const byId = new Map<string, any>()
    for (const p of products ?? []) byId.set(p._id, p)

    const normalized = body.items
      .map((x) => {
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

    const subtotal = normalized.reduce((sum, x) => sum + x.product.price * x.qty, 0)

    // ✅ Schnittmenge der Versandprofile über alle Produkte
    let intersection: Map<string, any> | null = null

    for (const {product} of normalized) {
      const profiles = Array.isArray(product?.shippingProfiles) ? product.shippingProfiles : []
      const activeForRegion = profiles
        .filter((p: any) => p && p.isActive !== false)
        .filter((p: any) => p.region === country)

      const map = new Map<string, any>()
      for (const p of activeForRegion) map.set(p._id, p)

      if (intersection === null) {
        intersection = map
      } else {
        const next = new Map<string, any>()
        for (const [id, val] of intersection.entries()) {
          if (map.has(id)) next.set(id, val)
        }
        intersection = next
      }
    }

    const optionsRaw = intersection ? Array.from(intersection.values()) : []
    if (!optionsRaw.length) {
      return NextResponse.json(
        {ok: false, error: "Für diese Produkte ist kein gemeinsamer Versand verfügbar."},
        {status: 400}
      )
    }

    const options = optionsRaw
      .map((p: any) => {
        const price = typeof p?.price === "number" ? p.price : 0
        const freeFrom = typeof p?.freeFrom === "number" ? p.freeFrom : null
        const cost = freeFrom !== null && subtotal >= freeFrom ? 0 : price
        return {
          id: p._id,
          title: p.title,
          region: p.region,
          shippingClass: p.shippingClass,
          price,
          freeFrom,
          cost,
        }
      })
      .sort((a: any, b: any) => a.cost - b.cost)

    const def = pickDefault(options) ?? options[0]
    const vatRate = 0.2 // MVP: 20% (AT Standard). Später dynamisch pro Land/Business.
    const shippingCost = def?.cost ?? 0
    const total = subtotal + shippingCost
    const tax = total - total / (1 + vatRate)

    return NextResponse.json({
      ok: true,
      currency: "EUR",
      subtotal,
      shippingOptions: options.map((x: any) => ({...x, isDefault: x.id === def.id})),
      defaultShippingProfileId: def.id,
      shippingCost,
      total,
      tax,
      vatRate,
    })
  } catch (err: any) {
    return NextResponse.json({ok: false, error: err?.message ?? "Quote error"}, {status: 500})
  }
}