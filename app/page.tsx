import Link from "next/link"
import Image from "next/image"
import {client} from "@/sanity/lib/client"
import {urlFor} from "@/sanity/lib/image"

export const metadata = {
  title: "c2r.at – Premium Vehicle Rental & Equipment",
  description:
    "Vermietung: Luxuswohnwagen, Reisemobile, Adventure Vans, Arbeitsbühnen, PKW-Anhänger – plus Zubehör & Ersatzteile für G-Klasse, Auto, Camper & Caravans. 4650 Lambach (OÖ).",
}

const settingsQuery = `*[_type == "siteSettings" && _id == "siteSettings"][0]{
  homeFeaturedRentals[]->{
    _id,
    name,
    "slug": slug.current,
    pricingModel,
    preisProTag,
    preisProNacht,
    saisonPreise[]{pricePerNight},
    tarife[]{title, type, days, price},
    "image": bilder[0]
  }
}`

const fallbackFeaturedQuery = `*[
  _type == "mietObjekt" &&
  defined(slug.current) &&
  aktiv == true
] | order(_createdAt desc)[0..2]{
  _id,
  name,
  "slug": slug.current,
  pricingModel,
  preisProTag,
  preisProNacht,
  saisonPreise[]{pricePerNight},
  tarife[]{title, type, days, price},
  "image": bilder[0]
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

function formatPriceLine(item: any) {
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

  if (model === "day" && typeof perDay === "number") return {value: perDay, unit: "Tag", prefix: "ab"}
  if (model === "night" && typeof perNight === "number") return {value: perNight, unit: "Nacht", prefix: "ab"}
  if (model === "seasonal" && typeof seasonMin === "number") return {value: seasonMin, unit: "Nacht", prefix: "ab"}

  if (typeof perDay === "number") return {value: perDay, unit: "Tag", prefix: "ab"}
  if (typeof perNight === "number") return {value: perNight, unit: "Nacht", prefix: "ab"}
  if (typeof seasonMin === "number") return {value: seasonMin, unit: "Nacht", prefix: "ab"}

  return null
}

export default async function HomePage() {
  const settings = await client.fetch(settingsQuery, {}, {perspective: "published"})
  const fromSettings = Array.isArray(settings?.homeFeaturedRentals) ? settings.homeFeaturedRentals : []

  const featured =
    fromSettings.length > 0 ? fromSettings : await client.fetch(fallbackFeaturedQuery, {}, {perspective: "published"})

  return (
    <main className="bg-white text-black">
      {/* HERO */}
      <section className="relative h-[90vh] min-h-[700px] w-full overflow-hidden">
        <Image src="/hero.jpg" alt="Premium Fahrzeuge und Equipment" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

        {/* ✅ text-white fix: verhindert "dunkle Links" */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight">Drive Different.</h1>

          <p className="mt-6 text-white/80 text-lg md:text-xl max-w-3xl">
            Vermietung – Luxuswohnwagen, Reisemobile, Adventure Vans, Arbeitsbühnen, PKW Anhänger, sowie Zubehör &
            Ersatzteile für G-Klasse, Auto, Camper und Caravans!
          </p>

          {/* ✅ Shop-Kategorie-Chips (echte Links) */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-3xl">
            <Link
              href="/shop?cat=w463-g-klasse-specials"
              className="px-3 py-1 rounded-full border border-white/20 text-white/85 text-xs bg-white/5 backdrop-blur hover:bg-white/10 transition"
            >
              G-Klasse Parts
            </Link>
            <Link
              href="/shop?cat=camping-and-caravan"
              className="px-3 py-1 rounded-full border border-white/20 text-white/85 text-xs bg-white/5 backdrop-blur hover:bg-white/10 transition"
            >
              Caravan Zubehör
            </Link>
            <Link
              href="/shop?cat=highlights"
              className="px-3 py-1 rounded-full border border-white/20 text-white/85 text-xs bg-white/5 backdrop-blur hover:bg-white/10 transition"
            >
              Shop-Highlights
            </Link>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/miete"
              className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:opacity-85 transition"
            >
              Fahrzeuge mieten
            </Link>

            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-white/10 text-white px-6 py-3 text-sm font-medium border border-white/25 hover:bg-white hover:text-black transition"
            >
              Zum Shop
            </Link>

            <Link
              href="/anfrage"
              className="inline-flex items-center justify-center rounded-full border border-white px-6 py-3 text-sm text-white hover:bg-white hover:text-black transition"
            >
              Unverbindlich anfragen
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ausgewählte Fahrzeuge</h2>
          <p className="mt-4 text-neutral-600">Unsere Highlights – im Backend fix ausgewählt.</p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {Array.isArray(featured) && featured.length ? (
              featured.map((x: any) => <FeaturedCard key={x._id} item={x} />)
            ) : (
              <>
                <PlaceholderCard title="Noch keine Mietobjekte gefunden" />
                <PlaceholderCard title="Bitte in Sanity Mietobjekte anlegen" />
                <PlaceholderCard title="und Bilder/Slug setzen" />
              </>
            )}
          </div>

          <div className="mt-10">
            <Link
              href="/miete"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm hover:border-black transition"
            >
              Alle Mietobjekte ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="border-t border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Standort Lambach</h2>
          <p className="mt-6 text-neutral-600 text-lg">Bahnhofstraße 27 · 4650 Lambach · Oberösterreich</p>
          <div className="mt-8">
            <Link href="/kontakt" className="text-sm underline text-neutral-700 hover:text-black">
              Kontakt & Terminvereinbarung
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function FeaturedCard({item}: {item: any}) {
  const href = item?.slug ? `/miete/${encodeURIComponent(item.slug)}` : "/miete"
  const hasImage = !!item?.image?.asset
  const price = formatPriceLine(item)

  const tarifeRaw = Array.isArray(item?.tarife) ? item.tarife.filter((t: any) => typeof t?.price === "number") : []
  const tarife = sortTarife(tarifeRaw).slice(0, 2)

  return (
    <Link href={href} className="group rounded-3xl border border-neutral-200 p-8 hover:border-black transition block">
      <div className="relative aspect-[4/3] bg-neutral-100 rounded-2xl mb-6 overflow-hidden">
        {hasImage ? (
          <Image
            src={urlFor(item.image).width(1200).height(900).url()}
            alt={item?.name ?? "Mietobjekt"}
            fill
            className="object-cover group-hover:scale-[1.02] transition"
            unoptimized
          />
        ) : null}
      </div>

      <h3 className="text-xl font-semibold">{item?.name ?? "Mietobjekt"}</h3>

      <p className="mt-3 text-sm text-neutral-600">
        {price ? (
          <>
            {price.prefix} <span className="text-black font-semibold">{price.value} €</span> / {price.unit}
          </>
        ) : (
          <>Preis auf Anfrage – Details auf der Fahrzeugseite.</>
        )}
      </p>

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
    </Link>
  )
}

function PlaceholderCard({title}: {title: string}) {
  return (
    <div className="rounded-3xl border border-neutral-200 p-8 hover:border-black transition">
      <div className="aspect-[4/3] bg-neutral-100 rounded-2xl mb-6" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-neutral-600">Premium Mietobjekt – weitere Details auf der Fahrzeugseite.</p>
    </div>
  )
}