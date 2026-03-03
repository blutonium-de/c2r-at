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

export default async function MietePage() {
  const items = await client.fetch(query, {}, {perspective: "published"})

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Miete</h1>
        <p className="mt-3 text-neutral-600 max-w-2xl">
          Adventure Vans, Luxus Wohnwagen, Transport & Spezialfahrzeuge – sauber gepflegt über unser Admin-System.
        </p>
      </header>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: any) => {
          const img = item?.bilder?.[0]

          const tarifeRaw = Array.isArray(item?.tarife)
            ? item.tarife.filter((t: any) => typeof t?.price === "number")
            : []
          const tarife = sortTarife(tarifeRaw).slice(0, 2)

          return (
            <Link
              key={item._id}
              href={`/miete/${item.slug?.current}`}
              className="group rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl transition duration-300"
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
                  <div className="absolute top-4 left-4 text-xs px-3 py-1 rounded-full bg-black text-white">
                    Wartung / nicht buchbar
                  </div>
                ) : null}
              </div>

              <div className="p-6">
                <div className="text-xs text-neutral-500">{item.kategorieTitel ?? "Miete"}</div>

                <h3 className="mt-1 text-lg font-semibold">{item.name}</h3>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-neutral-600">{formatMainPrice(item)}</div>

                  <div className="text-sm text-neutral-500 group-hover:text-black transition">Details →</div>
                </div>

                {tarife.length ? (
                  <div className="mt-3 space-y-1">
                    {tarife.map((t: any, idx: number) => {
                      const label = t.title?.trim() ? t.title : formatTarifLabel(t)
                      return (
                        <div key={`${label}-${idx}`} className="text-xs text-neutral-600 flex justify-between gap-3">
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
      </section>
    </main>
  )
}