import Link from "next/link"
import Image from "next/image"
import {client} from "@/sanity/lib/client"
import {urlFor} from "@/sanity/lib/image"

const query = `*[_type=="mietObjekt" && aktiv==true]
  | order(sortOrder asc, name asc, _createdAt desc){
  _id,
  name,
  slug,
  sortOrder,
  highlightOrder,
  pricingModel,
  preisProTag,
  preisProNacht,
  saisonPreise[]{pricePerNight},
  tarife[]{title, type, days, price},
  inWartung,
  "kategorieTitel": kategorie->title,
  "kategorieSlug": kategorie->slug.current,
  bilder
}`

function formatTarifLabel(t: any) {
  if (!t) return ""
  if (t.type === "package") return typeof t.days === "number" ? `Paket (${t.days} Tage)` : "Paket"
  if (t.type === "weekend") return "Weekend"
  if (t.type === "daily") return "Mo–Do"
  return t.title ?? "Tarif"
}

function sortTarife(tarife: any[]) {
  const order = {daily: 1, weekend: 2, package: 3}
  return [...tarife].sort((a, b) => {
    const ao = order[a?.type as keyof typeof order] ?? 99
    const bo = order[b?.type as keyof typeof order] ?? 99
    if (ao !== bo) return ao - bo
    const ad = typeof a?.days === "number" ? a.days : 9999
    const bd = typeof b?.days === "number" ? b.days : 9999
    return ad - bd
  })
}

function formatMainPrice(item: any) {
  const model = item?.pricingModel
  const perDay = typeof item?.preisProTag === "number" ? item.preisProTag : null
  const perNight = typeof item?.preisProNacht === "number" ? item.preisProNacht : null

  const seasonPrices = Array.isArray(item?.saisonPreise) ? item.saisonPreise : []
  const seasonMin =
    seasonPrices.length > 0
      ? Math.min(
          ...seasonPrices
            .map((x: any) => (typeof x?.pricePerNight === "number" ? x.pricePerNight : null))
            .filter((x: any) => typeof x === "number")
        )
      : null

  if (model === "day" && typeof perDay === "number") return `ab ${perDay} € / Tag`
  if (model === "night" && typeof perNight === "number") return `ab ${perNight} € / Nacht`
  if (model === "seasonal" && typeof seasonMin === "number") return `ab ${seasonMin} € / Nacht`

  if (typeof perDay === "number") return `ab ${perDay} € / Tag`
  if (typeof perNight === "number") return `ab ${perNight} € / Nacht`
  if (typeof seasonMin === "number") return `ab ${seasonMin} € / Nacht`

  return "Preis auf Anfrage"
}

export default async function MietePage({
  searchParams,
}: {
  searchParams?: Promise<{kategorie?: string}> | {kategorie?: string}
}) {
  const resolvedSearchParams =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as any)
      : (searchParams as any)

  const activeCategory = String(resolvedSearchParams?.kategorie ?? "").trim().toLowerCase()
  const items = await client.fetch(query, {}, {perspective: "published"})

  const categories = Array.from(
    new Map(
      (Array.isArray(items) ? items : [])
        .filter((item: any) => item?.kategorieSlug && item?.kategorieTitel)
        .map((item: any) => [
          item.kategorieSlug,
          {
            slug: item.kategorieSlug,
            title: item.kategorieTitel,
          },
        ])
    ).values()
  )

  const filteredItems = activeCategory
    ? items.filter((item: any) => String(item?.kategorieSlug ?? "").toLowerCase() === activeCategory)
    : items

  const highlightItems = (Array.isArray(items) ? items : [])
    .filter((item: any) => typeof item?.highlightOrder === "number")
    .sort((a: any, b: any) => {
      const ao = typeof a?.highlightOrder === "number" ? a.highlightOrder : 9999
      const bo = typeof b?.highlightOrder === "number" ? b.highlightOrder : 9999
      if (ao !== bo) return ao - bo
      return String(a?.name ?? "").localeCompare(String(b?.name ?? ""))
    })
    .slice(0, 20)

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-14 pb-5 md:pb-8">
        <h1 className="text-[22px] md:text-5xl font-semibold tracking-tight">Miete</h1>

        <p className="hidden md:block mt-3 text-neutral-600 max-w-2xl">
          Adventure Vans, Luxus Wohnwagen, Transport & Spezialfahrzeuge – sauber gepflegt über unser Admin-System.
        </p>

        <div className="mt-5 md:mt-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <Link
              href="/miete"
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm border transition ${
                !activeCategory
                  ? "border-black bg-black text-white"
                  : "border-neutral-300 bg-white text-black hover:border-black"
              }`}
            >
              Alle
            </Link>

            {categories.map((cat: any) => {
              const isActive = activeCategory === String(cat.slug).toLowerCase()

              return (
                <Link
                  key={cat.slug}
                  href={`/miete?kategorie=${cat.slug}`}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm border whitespace-nowrap transition ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-neutral-300 bg-white text-black hover:border-black"
                  }`}
                >
                  {cat.title}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {highlightItems.length ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-8">
          <div className="md:hidden mb-3 text-sm text-neutral-600">
            Adventure Vans, Luxus Wohnwagen, Transport & Spezialfahrzeuge – sauber gepflegt über unser Admin-System.
          </div>

          <div className="flex items-end justify-between gap-4 mb-3">
            <h2 className="text-base md:text-lg font-semibold tracking-tight">Unsere Miet-Highlights & Aktionen</h2>
            <Link href="/miete" className="text-sm text-neutral-600 hover:text-black underline shrink-0">
              Alle ansehen
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth pr-1" style={{scrollbarWidth: "thin"} as any}>
            {highlightItems.map((item: any) => {
              const img = item?.bilder?.[0]
              const tarifeRaw = Array.isArray(item?.tarife)
                ? item.tarife.filter((t: any) => typeof t?.price === "number")
                : []
              const tarife = sortTarife(tarifeRaw).slice(0, 1)

              return (
                <Link
                  key={item._id}
                  href={`/miete/${item.slug?.current}`}
                  className="shrink-0 w-[31.5%] min-w-[31.5%] sm:w-[220px] sm:min-w-[220px] rounded-2xl border border-neutral-200 overflow-hidden bg-white"
                >
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    {img ? (
                      <Image
                        src={urlFor(img).width(900).height(675).url()}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}

                    {item.inWartung ? (
                      <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-black text-white">
                        Wartung
                      </div>
                    ) : null}
                  </div>

                  <div className="px-3 pt-3 pb-3">
                    <div className="text-[10px] text-neutral-500 line-clamp-1">{item.kategorieTitel ?? "Miete"}</div>

                    <div className="mt-1 text-[12px] font-medium leading-snug line-clamp-2 min-h-[2.6rem]">
                      {item.name}
                    </div>

                    <div className="mt-2 text-[12px] font-semibold">{formatMainPrice(item)}</div>

                    {tarife.length ? (
                      <div className="mt-1 text-[10px] text-neutral-500 line-clamp-1">
                        {tarife[0].title?.trim() ? tarife[0].title : formatTarifLabel(tarife[0])} · {tarife[0].price} €
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 p-6 text-sm text-neutral-600">
            Für diese Kategorie sind aktuell keine Mietobjekte verfügbar.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredItems.map((item: any) => {
              const img = item?.bilder?.[0]

              const tarifeRaw = Array.isArray(item?.tarife)
                ? item.tarife.filter((t: any) => typeof t?.price === "number")
                : []
              const tarife = sortTarife(tarifeRaw).slice(0, 2)

              return (
                <Link
                  key={item._id}
                  href={`/miete/${item.slug?.current}`}
                  className="group rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl transition duration-300 bg-white"
                >
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    {img ? (
                      <Image
                        src={urlFor(img).width(1200).height(900).url()}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition duration-300"
                        unoptimized
                      />
                    ) : null}

                    {item.inWartung ? (
                      <div className="absolute top-3 left-3 text-[11px] md:text-xs px-3 py-1 rounded-full bg-black text-white">
                        Wartung / nicht buchbar
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4 md:p-6">
                    <div className="text-[11px] md:text-xs text-neutral-500 line-clamp-1">{item.kategorieTitel ?? "Miete"}</div>

                    <h3 className="mt-1 text-sm md:text-lg font-semibold line-clamp-2 min-h-[2.6rem] md:min-h-[3.25rem]">
                      {item.name}
                    </h3>

                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="text-sm text-neutral-600">{formatMainPrice(item)}</div>

                      <div className="hidden md:block text-sm text-neutral-500 group-hover:text-black transition">
                        Details →
                      </div>
                    </div>

                    {tarife.length ? (
                      <div className="mt-3 space-y-1">
                        {tarife.map((t: any, idx: number) => {
                          const label = t.title?.trim() ? t.title : formatTarifLabel(t)
                          return (
                            <div key={`${label}-${idx}`} className="text-[11px] md:text-xs text-neutral-600 flex justify-between gap-3">
                              <span className="truncate">{label}</span>
                              <span className="whitespace-nowrap font-medium text-neutral-800">{t.price} €</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}