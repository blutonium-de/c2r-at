import Image from "next/image"
import Link from "next/link"
import {client} from "@/sanity/lib/client"
import {urlFor} from "@/sanity/lib/image"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getPackages() {
  const items = await client.fetch(
    `
    *[_type == "optionPackage" && isActive == true] {
      _id,
      title,
      subtitle,
      price,
      priceNote,
      intro,
      features,
      buttonText,
      sortOrder,
      image
    }
  `,
    {},
    {
      cache: "no-store",
      next: {revalidate: 0},
      perspective: "published",
    }
  )

  return (items || []).sort((a: any, b: any) => {
    const aa = typeof a.sortOrder === "number" ? a.sortOrder : 999
    const bb = typeof b.sortOrder === "number" ? b.sortOrder : 999
    return aa - bb
  })
}

export default async function OptionenPage() {
  const items = await getPackages()

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Ausstattungspakete & Optionen
        </h1>

        <p className="mt-6 text-neutral-600">
          Für ein perfektes Reiseerlebnis können Sie Ihr Mietfahrzeug individuell erweitern.
          Vom kostenlosen Basispaket bis hin zum Rundum-Sorglos-Paket finden Sie hier alle
          verfügbaren Optionen.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {items.map((item: any) => (
          <div
            key={item._id}
            className="flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white"
          >
            <div className="relative aspect-[4/3] bg-neutral-100">
              {item.image ? (
                <Image
                  src={urlFor(item.image).width(1200).height(900).url()}
                  alt={item.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>

            <div className="bg-black text-white p-5 text-center">
              <div className="text-xs uppercase tracking-wider opacity-70">
                {item.subtitle}
              </div>

              <h2 className="mt-2 text-xl font-semibold">
                {item.title}
              </h2>

              <div className="mt-3 text-3xl font-bold">
                {item.price}
              </div>

              {item.priceNote ? (
                <div className="mt-1 text-sm opacity-80">
                  {item.priceNote}
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col p-5 gap-6">
              {item.intro ? (
                <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                  {item.intro}
                </div>
              ) : null}

              {Array.isArray(item.features) && item.features.length ? (
                <ul className="space-y-2 text-sm">
                  {item.features.map((f: string) => (
                    <li key={f} className="flex gap-2">
                      <span className="mt-[1px]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <Link
                href="/anfrage"
                className="mt-auto inline-flex w-full justify-center rounded-full bg-black px-4 py-3 text-white hover:opacity-85 transition"
              >
                {item.buttonText || "Jetzt anfragen"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}