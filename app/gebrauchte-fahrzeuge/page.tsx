import Link from "next/link"
import Image from "next/image"
import {client} from "@/sanity/lib/client"
import {urlFor} from "@/sanity/lib/image"

export const revalidate = 60

const query = `*[_type == "usedVehicle" && isActive == true] | order(sortOrder asc){
  _id,
  title,
  platform,
  externalUrl,
  price,
  mileage,
  firstRegistration,
  power,
  fuel,
  gearbox,
  image,
  isSold
}`

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

export default async function UsedVehiclesPage() {
  const vehicles = await client.fetch(query)

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Gebrauchte Fahrzeuge
        </h1>

        <p className="mt-4 text-neutral-600 text-sm md:text-base leading-relaxed">
          Ausgewählte Fahrzeuge von Blutonium Cars.
          Alle Inserate führen direkt zu willhaben.at,
          AutoScout24 oder externen Verkaufsplattformen.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v: any) => (
          <a
            key={v._id}
            href={v.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group border border-neutral-200 rounded-3xl overflow-hidden bg-white hover:border-black transition"
          >
            <div className="relative aspect-[4/3] bg-neutral-100">
              {v.image ? (
                <Image
                  src={urlFor(v.image).width(1200).height(900).url()}
                  alt={v.title ?? "Fahrzeug"}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition"
                  unoptimized
                />
              ) : null}

              {v.isSold ? (
                <div className="absolute top-3 left-3 rounded-full bg-red-600 text-white text-xs px-3 py-1 font-medium">
                  Verkauft
                </div>
              ) : null}
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
                {v.platform === "willhaben"
                  ? "willhaben"
                  : v.platform === "autoscout24"
                    ? "AutoScout24"
                    : "Extern"}
              </div>

              <h2 className="mt-2 text-lg font-semibold leading-snug">
                {v.title}
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {v.mileage ? (
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs">
                    {v.mileage}
                  </span>
                ) : null}

                {v.firstRegistration ? (
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs">
                    EZ {v.firstRegistration}
                  </span>
                ) : null}

                {v.power ? (
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs">
                    {v.power}
                  </span>
                ) : null}

                {v.fuel ? (
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs">
                    {v.fuel}
                  </span>
                ) : null}

                {v.gearbox ? (
                  <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs">
                    {v.gearbox}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="text-xl font-bold">
                  {typeof v.price === "number"
                    ? `${money(v.price)} €`
                    : "Preis auf Anfrage"}
                </div>

                <div className="rounded-full bg-black text-white px-4 py-2 text-sm">
                  Inserat öffnen
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {!vehicles?.length ? (
        <div className="mt-16 text-neutral-500">
          Aktuell keine Fahrzeuge verfügbar.
        </div>
      ) : null}
    </main>
  )
}