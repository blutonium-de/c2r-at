"use client"

import {useMemo, useRef} from "react"
import Link from "next/link"
import Image from "next/image"
import {urlFor} from "@/sanity/lib/image"

type RailProduct = {
  _id: string
  title?: string
  slug?: {current?: string} | string
  price?: number | null
  images?: any[]
  stock?: number
  deliveryTimeLabel?: string
  shippingNote?: string
}

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

function getSlug(p: any) {
  if (!p) return ""
  if (typeof p.slug === "string") return p.slug
  return p?.slug?.current ?? ""
}

export default function ProductRail({
  products,
  compact,
  title,
  viewAllHref,
}: {
  products: RailProduct[]
  compact?: boolean
  title?: string
  viewAllHref?: string
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const items = useMemo(() => (Array.isArray(products) ? products : []).slice(0, 20), [products])

  function scrollByAmount(dir: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    const amount = compact ? 320 : 240
    el.scrollBy({left: dir * amount, behavior: "smooth"})
  }

  return (
    <div className="relative">
      {title ? (
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="text-base md:text-lg font-semibold tracking-tight">{title}</div>
          {viewAllHref ? (
            <Link href={viewAllHref} className="text-sm text-neutral-600 hover:text-black underline shrink-0">
              Zum Shop
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          className="h-8 w-8 rounded-full border border-neutral-200 hover:border-black transition grid place-items-center bg-white"
          aria-label="Zurück"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          className="h-8 w-8 rounded-full border border-neutral-200 hover:border-black transition grid place-items-center bg-white"
          aria-label="Weiter"
        >
          →
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth pr-1"
        style={{scrollbarWidth: "thin"} as any}
      >
        {items.map((p: any) => {
          const slug = getSlug(p)
          const href = slug ? `/shop/${encodeURIComponent(slug)}` : "/shop"

          const imgs = Array.isArray(p?.images) ? p.images.filter((x: any) => x?.asset) : []
          const hero = imgs[0] ?? null

          return (
            <Link
              key={p._id}
              href={href}
              className={[
                "shrink-0 border border-neutral-200 bg-white rounded-2xl overflow-hidden hover:shadow-lg transition",
                compact
                  ? "w-[31.5%] min-w-[31.5%] sm:w-[220px] sm:min-w-[220px]"
                  : "w-[220px] min-w-[220px]",
              ].join(" ")}
            >
              <div className="relative aspect-[4/3] bg-neutral-100">
                {hero ? (
                  <Image
                    src={urlFor(hero).width(900).height(675).url()}
                    alt={p?.title ?? "Produkt"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-neutral-400">Kein Bild</div>
                )}
              </div>

              <div className={compact ? "p-3" : "p-4"}>
                <div className={`${compact ? "text-[12px]" : "text-sm"} font-medium leading-snug line-clamp-2 min-h-[2.6rem]`}>
                  {p?.title ?? "Produkt"}
                </div>

                <div className="mt-2">
                  <div className={`${compact ? "text-[12px]" : "text-sm"} font-semibold`}>
                    {typeof p?.price === "number" ? `${money(p.price)} €` : "Preis auf Anfrage"}
                  </div>
                  {!compact ? <div className="text-[11px] text-neutral-500">inkl. MwSt.</div> : null}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}