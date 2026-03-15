import Link from "next/link"
import Image from "next/image"
import {client} from "@/sanity/lib/client"
import {urlFor} from "@/sanity/lib/image"
import ProductSlider from "@/components/shop/ProductSlider"

export const metadata = {
  title: "Shop – c2r.at",
  description: "G-Klasse Parts, Caravan Zubehör & Shop-Highlights.",
}

type SearchParams =
  | Promise<{[key: string]: string | string[] | undefined}>
  | {[key: string]: string | string[] | undefined}

function getParam(sp: any, key: string) {
  const v = sp?.[key]
  if (!v) return ""
  if (Array.isArray(v)) return String(v[0] ?? "")
  return String(v)
}

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

const categoriesQuery = `*[_type == "shopCategory" && (isActive == true || !defined(isActive))] | order(title asc){
  _id,
  title,
  "slug": slug.current
}`

const listQuery = `*[
  _type == "product" &&
  isActive == true &&
  defined(slug.current) &&
  (
    $cat == "" ||
    category->slug.current == $cat ||
    count(categories[]->slug.current[@ == $cat]) > 0
  ) &&
  (
    $q == "" ||
    title match $qWild ||
    sku match $qWild ||
    description match $qWild
  )
] | order(_createdAt desc){
  _id,
  title,
  "slug": slug.current,
  price,
  condition,
  "image": images[0]
}`

const sliderQuery = `*[
  _type == "product" &&
  isActive == true &&
  defined(slug.current) &&
  (
    $cat == "" ||
    category->slug.current == $cat ||
    count(categories[]->slug.current[@ == $cat]) > 0
  ) &&
  (
    $q == "" ||
    title match $qWild ||
    sku match $qWild ||
    description match $qWild
  )
] | order(_createdAt desc)[0...20]{
  _id,
  title,
  slug,
  price,
  images,
  stock,
  deliveryTimeLabel,
  shippingNote
}`

export default async function ShopPage({searchParams}: {searchParams?: SearchParams}) {
  const sp = typeof (searchParams as any)?.then === "function" ? await (searchParams as any) : searchParams
  const cat = getParam(sp, "cat")
  const q = getParam(sp, "q").trim()
  const qWild = q ? `*${q}*` : ""

  const [categories, items, sliderItems] = await Promise.all([
    client.fetch(categoriesQuery, {}, {perspective: "published"}),
    client.fetch(listQuery, {cat, q, qWild}, {perspective: "published"}),
    client.fetch(sliderQuery, {cat, q, qWild}, {perspective: "published"}),
  ])

  const activeCat = Array.isArray(categories) && cat ? categories.find((c: any) => c?.slug === cat) : null

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        <div className="text-sm text-neutral-500">Shop</div>

        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">Parts & Zubehör</h1>

        <p className="mt-3 text-neutral-600 max-w-2xl">
          G-Klasse Ersatzteile (neu/gebraucht), Caravan Zubehör und ausgewählte Shop-Highlights.
        </p>

        {/* Suche */}
        <form action="/shop" method="get" className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="cat" value={cat} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Suche nach Produkt, SKU oder Begriff…"
              className="w-full rounded-full border border-neutral-300 px-5 py-3 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-3 text-sm hover:opacity-85 transition"
            >
              Suchen
            </button>
          </div>
        </form>

        {/* Filter-Chips */}
        {Array.isArray(categories) && categories.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={q ? `/shop?q=${encodeURIComponent(q)}` : "/shop"}
              className={`px-3 py-1 rounded-full border text-xs transition ${
                !cat ? "border-black text-black" : "border-neutral-200 text-neutral-700 hover:border-black"
              }`}
            >
              Alle
            </Link>

            {categories.map((c: any) => {
              const href = c?.slug
                ? q
                  ? `/shop?cat=${encodeURIComponent(c.slug)}&q=${encodeURIComponent(q)}`
                  : `/shop?cat=${encodeURIComponent(c.slug)}`
                : "/shop"
              const isActive = c?.slug && c.slug === cat
              return (
                <Link
                  key={c._id}
                  href={href}
                  className={`px-3 py-1 rounded-full border text-xs transition ${
                    isActive ? "border-black text-black" : "border-neutral-200 text-neutral-700 hover:border-black"
                  }`}
                >
                  {c?.title ?? "Kategorie"}
                </Link>
              )
            })}
          </div>
        ) : null}

        {activeCat || q ? (
          <div className="mt-4 text-sm text-neutral-600 flex flex-wrap gap-x-3 gap-y-1">
            {activeCat ? (
              <div>
                Gefiltert nach: <span className="font-medium text-black">{activeCat.title}</span>
              </div>
            ) : null}

            {q ? (
              <div>
                Suche: <span className="font-medium text-black">„{q}“</span>
              </div>
            ) : null}

            <Link href="/shop" className="underline text-neutral-700 hover:text-black">
              Filter entfernen
            </Link>
          </div>
        ) : null}
      </header>

      {/* Produktliste */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(items) && items.length ? (
          items.map((p: any) => {
            const href = p?.slug ? `/shop/${encodeURIComponent(p.slug)}` : "/shop"
            const hasImage = !!p?.image?.asset
            const condLabel = p?.condition === "neu" ? "Neu" : p?.condition === "gebraucht" ? "Gebraucht" : null

            return (
              <Link
                key={p._id}
                href={href}
                className="group rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl transition duration-300"
              >
                <div className="relative aspect-[4/3] bg-neutral-100">
                  {hasImage ? (
                    <Image
                      src={urlFor(p.image).width(1200).height(900).url()}
                      alt={p?.title ?? "Produkt"}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition duration-300"
                      unoptimized
                    />
                  ) : null}

                  {condLabel ? (
                    <div className="absolute top-4 left-4 text-xs px-3 py-1 rounded-full bg-white/90 border border-neutral-200">
                      {condLabel}
                    </div>
                  ) : null}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold line-clamp-2 min-h-[3.25rem]">{p?.title ?? "Produkt"}</h3>

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-sm text-neutral-900 font-semibold">
                        {typeof p?.price === "number" ? `${money(p.price)} €` : "Preis auf Anfrage"}
                      </div>
                      <div className="text-xs text-neutral-500">inkl. MwSt.</div>
                    </div>

                    <div className="text-sm text-neutral-500 group-hover:text-black transition shrink-0">Details →</div>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-neutral-600">
            Keine Produkte gefunden.
            {q ? (
              <>
                {" "}
                <Link href={cat ? `/shop?cat=${encodeURIComponent(cat)}` : "/shop"} className="underline hover:text-black">
                  Suche zurücksetzen
                </Link>
              </>
            ) : null}
          </div>
        )}
      </section>

      {/* Slider unten */}
      {Array.isArray(sliderItems) && sliderItems.length ? (
        <section className="mt-16 border-t border-neutral-200 pt-10 pb-12">
          <ProductSlider
            title="Beliebt"
            items={sliderItems}
            viewAllHref={
              cat && q
                ? `/shop?cat=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`
                : cat
                  ? `/shop?cat=${encodeURIComponent(cat)}`
                  : q
                    ? `/shop?q=${encodeURIComponent(q)}`
                    : "/shop"
            }
          />
        </section>
      ) : null}
    </main>
  )
}