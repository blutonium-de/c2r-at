"use client"

import Image from "next/image"
import {useEffect, useMemo, useState} from "react"
import {useParams} from "next/navigation"
import {client} from "@/sanity/lib/client"
import {urlFor} from "@/sanity/lib/image"
import {PortableText} from "@portabletext/react"

const query = `*[_type=="mietObjekt" && slug.current == $slug][0]{
  _id,
  name,
  pricingModel,
  preisProTag,
  preisProNacht,
  saisonPreise[]{title, months, pricePerNight},
  tarife[]{title, type, days, price},
  kaution,
  mindestMietdauer,
  sitzplaetze,
  schlafplaetze,
  getriebe,
  ausstattung,
  beschreibung,
  beschreibungRich,
  inWartung,
  wartungVon,
  wartungBis,
  servicePauschale,
  endReinigung,
  preiseHinweis,
  langzeitRabatte[]{fromWeeks, percent},
  "kategorieTitel": kategorie->title,
  "bilder": bilder[]{ _key, asset }
}`

function tarifSubtitle(t: any) {
  if (!t) return ""
  if (t.type === "daily") return "Mo–Do"
  if (t.type === "weekend") return "Fr–Sa"
  if (t.type === "package") {
    const d = typeof t.days === "number" ? t.days : null
    return d ? `Paket (${d} Tage)` : "Paket"
  }
  return ""
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

function calcPerDay(t: any) {
  if (t?.type !== "package") return null
  if (typeof t?.days !== "number" || t.days <= 0) return null
  if (typeof t?.price !== "number") return null
  return Math.round((t.price / t.days) * 100) / 100
}

function monthsToLabel(months: any) {
  if (!Array.isArray(months)) return ""
  const map: Record<string, string> = {
    "01": "Jänner",
    "02": "Februar",
    "03": "März",
    "04": "April",
    "05": "Mai",
    "06": "Juni",
    "07": "Juli",
    "08": "August",
    "09": "September",
    "10": "Oktober",
    "11": "November",
    "12": "Dezember",
  }
  return months.map((m) => map[m] ?? m).join(", ")
}

export default function MietDetail() {
  const params = useParams<{slug?: string}>()
  const slug = useMemo(() => {
    const raw = params?.slug
    return raw ? decodeURIComponent(raw).trim() : ""
  }, [params?.slug])

  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!slug) return
      setLoading(true)

      const data = await client.fetch(query, {slug}, {perspective: "previewDrafts"})

      if (!cancelled) {
        setItem(data)
        setActiveIndex(0)
        setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (!slug) return <div className="p-6">404</div>
  if (loading) return <div className="p-6">Lade…</div>
  if (!item) return <div className="p-6">404</div>

  const images = Array.isArray(item?.bilder) ? item.bilder.filter((x: any) => x?.asset) : []
  const hero = images[activeIndex] ?? images[0]

  const tarifeRaw = Array.isArray(item?.tarife)
    ? item.tarife.filter((t: any) => typeof t?.price === "number")
    : []
  const tarife = sortTarife(tarifeRaw)

  const pricingModel = item?.pricingModel
  const saison = Array.isArray(item?.saisonPreise) ? item.saisonPreise : []
  const saisonMin =
    saison.length > 0
      ? Math.min(
          ...saison
            .map((x: any) => (typeof x?.pricePerNight === "number" ? x.pricePerNight : null))
            .filter((x: any) => typeof x === "number")
        )
      : null

  const baseDay = typeof item?.preisProTag === "number" ? item.preisProTag : null
  const baseNight = typeof item?.preisProNacht === "number" ? item.preisProNacht : null

  let headlinePrice: {text: string; unit: string} | null = null
  if (pricingModel === "day" && typeof baseDay === "number") headlinePrice = {text: `${baseDay} €`, unit: "Tag"}
  else if (pricingModel === "night" && typeof baseNight === "number") headlinePrice = {text: `${baseNight} €`, unit: "Nacht"}
  else if (pricingModel === "seasonal" && typeof saisonMin === "number") headlinePrice = {text: `ab ${saisonMin} €`, unit: "Nacht"}
  else if (typeof baseDay === "number") headlinePrice = {text: `${baseDay} €`, unit: "Tag"}
  else if (typeof baseNight === "number") headlinePrice = {text: `${baseNight} €`, unit: "Nacht"}
  else if (typeof saisonMin === "number") headlinePrice = {text: `ab ${saisonMin} €`, unit: "Nacht"}

  return (
    <main className="min-h-screen bg-white text-black overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20 min-w-0">
        <div className="text-sm text-neutral-500 break-words">{item.kategorieTitel}</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight break-words">{item.name}</h1>

        <div className="mt-8 grid lg:grid-cols-3 gap-8 min-w-0">
          <div className="lg:col-span-2 min-w-0">
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200">
              {hero ? (
                <Image
                  src={urlFor(hero).width(1800).height(1200).url()}
                  alt={item.name ?? "Miet-Objekt"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 min-w-0">
                {images.map((img: any, i: number) => (
                  <button
                    key={img?._key ?? i}
                    onClick={() => setActiveIndex(i)}
                    className={[
                      "relative h-20 w-28 shrink-0 rounded-xl overflow-hidden border",
                      i === activeIndex ? "border-black" : "border-neutral-200",
                    ].join(" ")}
                    aria-label={`Bild ${i + 1}`}
                    type="button"
                  >
                    <Image
                      src={urlFor(img).width(400).height(300).url()}
                      alt={`${item.name ?? "Bild"} ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            ) : null}

            {/* ✅ Beschreibung: RichText bevorzugt, fallback auf altes Textfeld mit echten Zeilenumbrüchen */}
            {Array.isArray(item?.beschreibungRich) && item.beschreibungRich.length > 0 ? (
              <div className="mt-6 text-neutral-700 leading-relaxed break-words max-w-none">
                <PortableText
                  value={item.beschreibungRich}
                  components={{
                    block: {
                      normal: ({children}) => <p className="my-3">{children}</p>,
                    },
                    marks: {
                      strong: ({children}) => <strong className="font-semibold text-black">{children}</strong>,
                      em: ({children}) => <em>{children}</em>,
                    },
                  }}
                />
              </div>
            ) : item.beschreibung ? (
              <p className="mt-6 text-neutral-700 leading-relaxed break-words whitespace-pre-line">{item.beschreibung}</p>
            ) : null}

            {Array.isArray(item.ausstattung) && item.ausstattung.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2 min-w-0">
                {item.ausstattung.map((x: string) => (
                  <span key={x} className="text-xs px-3 py-1 rounded-full border border-neutral-200 break-words">
                    {x}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="lg:col-span-1 min-w-0">
            <div className="rounded-3xl border border-neutral-200 p-6 sticky top-6 min-w-0">
              <div className="text-sm text-neutral-500">Preis</div>

              <div className="mt-1 text-2xl font-semibold break-words">
                {headlinePrice ? headlinePrice.text : "Preis auf Anfrage"}
                <span className="text-sm font-normal text-neutral-500"> / {headlinePrice?.unit ?? "Tag"}</span>
              </div>

              {pricingModel === "seasonal" && saison.length ? (
                <div className="mt-5 min-w-0">
                  <div className="text-sm font-medium text-neutral-900">
                    Saisonpreise (€/{headlinePrice?.unit ?? "Nacht"})
                  </div>

                  <div className="mt-2 space-y-2">
                    {saison.map((s: any, idx: number) => (
                      <div key={`${s?.title ?? "Saison"}-${idx}`} className="rounded-2xl border border-neutral-200 p-3">
                        <div className="flex items-baseline justify-between gap-4 min-w-0">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-neutral-900 truncate">{s?.title ?? "Saison"}</div>
                            <div className="text-xs text-neutral-600 break-words">{monthsToLabel(s?.months)}</div>
                          </div>
                          <div className="text-sm font-semibold text-black whitespace-nowrap">
                            {typeof s?.pricePerNight === "number" ? `${s.pricePerNight} €` : "—"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {tarife.length ? (
                <div className="mt-5 min-w-0">
                  <div className="text-sm font-medium text-neutral-900">Specials & Tarife</div>

                  <div className="mt-2">
                    {tarife.map((t: any, idx: number) => {
                      const perDay = calcPerDay(t)
                      const sub = tarifSubtitle(t)
                      const title =
                        t?.title ??
                        (t?.type === "package"
                          ? "Paket"
                          : t?.type === "weekend"
                            ? "Weekend"
                            : t?.type === "daily"
                              ? "Wochentags"
                              : "Tarif")

                      return (
                        <div
                          key={`${title}-${idx}`}
                          className="flex items-start justify-between gap-4 py-2 border-b border-neutral-100 last:border-b-0 min-w-0"
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-neutral-900 truncate">{title}</div>
                            {sub ? <div className="text-xs text-neutral-500 break-words">{sub}</div> : null}
                          </div>

                          <div className="text-right whitespace-nowrap">
                            <div className="text-base font-semibold text-black">{t.price} €</div>
                            {typeof perDay === "number" ? (
                              <div className="text-xs text-neutral-500">{perDay} € / Tag</div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 text-sm text-neutral-600 space-y-1 break-words">
                {item.kaution ? <div>Kaution: {item.kaution} €</div> : null}
                {item.mindestMietdauer ? <div>Mindestmiete: {item.mindestMietdauer} Tage</div> : null}
                {item.sitzplaetze ? <div>Sitzplätze: {item.sitzplaetze}</div> : null}
                {item.schlafplaetze ? <div>Schlafplätze: {item.schlafplaetze}</div> : null}
                {item.getriebe ? <div>Getriebe: {item.getriebe}</div> : null}
              </div>

              {item.inWartung ? (
                <div className="mt-5 text-sm p-3 rounded-2xl bg-neutral-100 border border-neutral-200 break-words">
                  Aktuell in Wartung / nicht buchbar
                  {item.wartungVon || item.wartungBis ? (
                    <div className="mt-1 text-xs text-neutral-600 break-words">
                      {item.wartungVon ? `von ${item.wartungVon}` : ""}{" "}
                      {item.wartungBis ? `bis ${item.wartungBis}` : ""}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <a
                href={`/anfrage?id=${encodeURIComponent(item._id)}&miete=${encodeURIComponent(item.name ?? "")}`}
                className="mt-6 inline-flex w-full justify-center px-5 py-3 rounded-full bg-black text-white text-sm hover:opacity-85 transition"
              >
                Anfrage senden
              </a>

              <div className="mt-3 text-xs text-neutral-500">Abholung/Übergabe: Lambach (OÖ)</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}