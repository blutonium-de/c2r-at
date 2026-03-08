import Link from "next/link"
import {client} from "@/sanity/lib/client"
import AddToCart from "@/components/shop/AddToCart"
import ProductGallery from "@/components/shop/ProductGallery"
import ProductRail from "@/components/shop/ProductRail"

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

function renderTextWithBold(input: string) {
  const parts = String(input).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/)
    if (m) return <strong key={i}>{m[1]}</strong>
    return <span key={i}>{p}</span>
  })
}

const query = `*[_type=="product" && slug.current == $slug][0]{
  _id,
  title,
  price,
  sku,
  condition,
  description,
  images,
  variants,
  stock,
  deliveryTimeLabel,
  shippingNote,
  categories[]->{_id, title, slug},
  shippingProfiles[]->{_id, title, region, shippingClass, price, freeFrom, isActive}
}`

export default async function ProductDetailPage({
  params,
}: {
  params: {slug: string} | Promise<{slug: string}>
}) {
  const resolvedParams =
    typeof (params as any)?.then === "function" ? await (params as any) : (params as any)
  const slug = resolvedParams?.slug

  if (!slug) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-20">
          <div className="rounded-3xl border border-neutral-200 p-6">
            <div className="text-lg font-semibold">Seite nicht gefunden</div>
            <div className="mt-2 text-sm text-neutral-600">
              Slug fehlt. Öffne die Seite bitte unter <b>/shop/DEIN-SLUG</b>.
            </div>
            <div className="mt-4">
              <Link href="/shop" className="underline text-sm text-neutral-700 hover:text-black">
                Zurück zum Shop
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const data = await client.fetch(query, {slug}, {perspective: "published"})

  if (!data?._id) return <div className="p-6">404</div>

  const images = Array.isArray(data?.images) ? data.images.filter((x: any) => x?.asset) : []
  const hero = images[0] ?? null

  const condLabel =
    data?.condition === "neu" ? "Neu" : data?.condition === "gebraucht" ? "Gebraucht" : null

  const delivery = String(data?.deliveryTimeLabel ?? "").trim() || null
  const shippingHint = String(data?.shippingNote ?? "").trim() || null

  const stockVal = typeof data?.stock === "number" ? data.stock : null
  const inStock = stockVal === null ? null : stockVal > 0

  const stockText = shippingHint
    ? shippingHint
    : inStock === null
      ? null
      : inStock
        ? "auf Lager"
        : "nicht auf Lager"

  const profiles = Array.isArray(data?.shippingProfiles) ? data.shippingProfiles : []
  const activeProfiles = profiles.filter((p: any) => p?.isActive !== false && typeof p?.price === "number")

  const minPrice = activeProfiles.length ? Math.min(...activeProfiles.map((p: any) => Number(p.price))) : null
  const minFreeFrom =
    activeProfiles.length && activeProfiles.some((p: any) => typeof p?.freeFrom === "number")
      ? Math.min(
          ...activeProfiles
            .map((p: any) => (typeof p?.freeFrom === "number" ? Number(p.freeFrom) : Infinity))
            .filter((x: number) => Number.isFinite(x))
        )
      : null

  const catIds = Array.isArray(data?.categories) ? data.categories.map((c: any) => c?._id).filter(Boolean) : []
  let moreProducts: any[] = []

  if (catIds.length) {
    moreProducts = await client.fetch(
      `*[_type=="product" && _id != $id && count((categories[]._ref)[@ in $catIds]) > 0][0...20]{
        _id, title, slug, price, images, stock, deliveryTimeLabel, shippingNote
      }`,
      {id: data._id, catIds},
      {perspective: "published"}
    )
  }

  if (!moreProducts?.length) {
    moreProducts = await client.fetch(
      `*[_type=="product" && _id != $id][0...20]{
        _id, title, slug, price, images, stock, deliveryTimeLabel, shippingNote
      }`,
      {id: data._id},
      {perspective: "published"}
    )
  }

  return (
    <main className="min-h-screen bg-white text-black overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        <div className="text-sm text-neutral-500">
          <Link href="/shop" className="hover:underline">
            Shop
          </Link>{" "}
          <span className="text-neutral-300">/</span> {data.title}
        </div>

        {/* MOBILE FIX */}
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] break-words">
            {data.title}
          </h1>

          {condLabel ? (
            <div className="self-start text-xs px-3 py-1 rounded-full border border-neutral-200">
              {condLabel}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {stockText ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs">
              <span className={`h-2 w-2 rounded-full ${inStock === false ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-neutral-700">{stockText}</span>
            </div>
          ) : null}

          {delivery ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs">
              <span className="text-neutral-700">⏱</span>
              <span className="text-neutral-700">{delivery}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProductGallery title={data.title ?? "Produkt"} images={images} />

            {data?.description ? (
              <p className="mt-6 text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {renderTextWithBold(String(data.description))}
              </p>
            ) : null}
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-neutral-200 p-6 sticky top-6">
              <div className="text-sm text-neutral-500">Preis</div>
              <div className="mt-1 text-2xl font-semibold">
                {typeof data?.price === "number" ? `${money(data.price)} €` : "Preis auf Anfrage"}
              </div>
              <div className="text-xs text-neutral-500 mt-1">inkl. MwSt.</div>

              {data?.sku ? <div className="mt-3 text-xs text-neutral-500">SKU: {data.sku}</div> : null}

              {typeof minPrice === "number" ? (
                <div className="mt-3 text-xs text-neutral-600 flex items-start gap-2">
                  <span className="mt-[1px]">📦</span>
                  <div>
                    Versand ab <span className="font-medium">{money(minPrice)} €</span>
                    {typeof minFreeFrom === "number" ? (
                      <>
                        {" "}
                        · frei ab <span className="font-medium">{money(minFreeFrom)} €</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-neutral-600 flex items-start gap-2">
                  <span className="mt-[1px]">📦</span>
                  <div>Versand & Abholung nach Absprache.</div>
                </div>
              )}

              <div className="mt-6">
                <AddToCart
                  product={{
                    _id: data._id,
                    title: data.title,
                    slug,
                    price: typeof data?.price === "number" ? data.price : null,
                    image: hero,
                  }}
                />
              </div>

              {stockText ? (
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs">
                    <span className={`h-2 w-2 rounded-full ${inStock === false ? "bg-red-500" : "bg-green-500"}`} />
                    <span className="text-neutral-700">{stockText}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        {Array.isArray(moreProducts) && moreProducts.length ? (
          <section className="mt-16 pt-10 border-t border-neutral-200">
            <ProductRail title="Das könnte dich auch interessieren" viewAllHref="/shop" products={moreProducts} />
          </section>
        ) : null}
      </div>
    </main>
  )
}