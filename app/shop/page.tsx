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

const highlightsQuery = `*[
  _type == "product" &&
  isActive == true &&
  defined(slug.current) &&
  defined(highlightOrder)
] | order(highlightOrder asc, _createdAt desc)[0...20]{
  _id,
  title,
  slug,
  price,
  images,
  stock,
  deliveryTimeLabel,
  shippingNote,
  highlightOrder
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

export default async function ShopPage({searchParams}: {searchParams?: SearchParams}) {
  const sp = typeof (searchParams as any)?.then === "function" ? await (searchParams as any) : searchParams
  const cat = getParam(sp, "cat")
  const q = getParam(sp, "q").trim()
  const qWild = q ? `*${q}*` : ""

  const [categories, highlightItems, items] = await Promise.all([
    client.fetch(categoriesQuery, {}, {perspective: "published"}),
    client.fetch(highlightsQuery, {}, {perspective: "published"}),
    client.fetch(listQuery, {cat, q, qWild}, {perspective: "published"}),
  ])

  const activeCat = Array.isArray(categories) && cat ? categories.find((c: any) => c?.slug === cat) : null

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-14 pb-5 md:pb-8">
        <h1 className="text-[22px] md:text-5xl font-semibold tracking-tight">Parts & Zubehör</h1>

        <p className="hidden md:block mt-3 text-neutral-600 max-w-2xl">
          G-Klasse Ersatzteile (neu/gebraucht), Caravan Zubehör und ausgewählte Shop-Highlights.
        </p>

        {/* Suche – immer 1 Zeile */}
        <form action="/shop" method="get" className="mt-5 md:mt-6">
          <div className="flex items-center gap-2">
            <input type="hidden" name="cat" value={cat} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Suche nach Produkt, SKU oder Begriff…"
              className="min-w-0 flex-1 rounded-full border border-neutral-300 px-5 py-3 text-sm outline-none focus:border-black"
            />
            <button
              type="submit"
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-3 text-sm hover:opacity-85 transition"
            >
              Suchen
            </button>
          </div>
        </form>

        {/* Kategorien als Slider */}
        {Array.isArray(categories) && categories.length ? (
          <div className="mt-5 md:mt-6 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              <Link
                href={q ? `/shop?q=${encodeURIComponent(q)}` : "/shop"}
                className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition ${
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
                    className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition ${
                      isActive ? "border-black text-black" : "border-neutral-200 text-neutral-700 hover:border-black"
                    }`}
                  >
                    {c?.title ?? "Kategorie"}
                  </Link>
                )
              })}
            </div>
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

      {/* Highlights oben */}
      {Array.isArray(highlightItems) && highlightItems.length ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-8">
          <div className="md:hidden mb-3 text-sm text-neutral-600">
            G-Klasse Ersatzteile (neu/gebraucht), Caravan Zubehör und ausgewählte Shop-Highlights.
          </div>

          <ProductSlider
            title="Blutonium & c2r Shop Highlights"
            items={highlightItems}
            viewAllHref="/shop"
          />
        </section>
      ) : null}

      {/* Produktliste */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.isArray(items) && items.length ? (
          items.map((p: any) => {
            const href = p?.slug ? `/shop/${encodeURIComponent(p.slug)}` : "/shop"
            const hasImage = !!p?.image?.asset
            const condLabel = p?.condition === "neu" ? "Neu" : p?.condition === "gebraucht" ? "Gebraucht" : null

            return (
              <Link
                key={p._id}
                href={href}
                className="group rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl transition duration-300 bg-white"
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
                    <div className="absolute top-3 left-3 text-[11px] md:text-xs px-3 py-1 rounded-full bg-white/90 border border-neutral-200">
                      {condLabel}
                    </div>
                  ) : null}
                </div>

                <div className="p-4 md:p-6">
                  <h3 className="text-sm md:text-lg font-semibold line-clamp-2 min-h-[2.6rem] md:min-h-[3.25rem]">
                    {p?.title ?? "Produkt"}
                  </h3>

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-sm text-neutral-900 font-semibold">
                        {typeof p?.price === "number" ? `${money(p.price)} €` : "Preis auf Anfrage"}
                      </div>
                      <div className="text-[11px] md:text-xs text-neutral-500">inkl. MwSt.</div>
                    </div>

                    <div className="hidden md:block text-sm text-neutral-500 group-hover:text-black transition shrink-0">
                      Details →
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="col-span-full text-neutral-600">
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
    </main>
  )
}