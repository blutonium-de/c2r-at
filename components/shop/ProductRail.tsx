"use client"

import {useMemo, useRef, useState} from "react"
import Link from "next/link"
import Image from "next/image"
import {useCart} from "@/lib/cart"
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
  title,
  viewAllHref,
  compact,
}: {
  products: RailProduct[]
  title?: string
  viewAllHref?: string
  compact?: boolean
}) {
  const {add} = useCart()
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)

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
        <div className="flex items-end justify-between gap-4 mb-3">
          <h2 className="text-base md:text-lg font-semibold tracking-tight">{title}</h2>
          {viewAllHref ? (
            <Link href={viewAllHref} className="text-sm text-neutral-600 hover:text-black underline shrink-0">
              Zum Shop
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className={`${compact ? "hidden md:flex" : "flex"} items-center justify-end gap-2 mb-3`}>
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
        className={`flex gap-3 overflow-x-auto ${compact ? "pb-2" : "pb-3"} scroll-smooth pr-1`}
        style={{scrollbarWidth: "thin"} as any}
      >
        {items.map((p: any) => {
          const slug = getSlug(p)
          const href = slug ? `/shop/${encodeURIComponent(slug)}` : "/shop"

          const imgs = Array.isArray(p?.images) ? p.images.filter((x: any) => x?.asset) : []
          const hero = imgs[0] ?? null

          const delivery = String(p?.deliveryTimeLabel ?? "").trim() || null
          const shippingHint = String(p?.shippingNote ?? "").trim() || null

          const stockVal = typeof p?.stock === "number" ? p.stock : null
          const inStock = stockVal === null ? null : stockVal > 0
          const stockText = shippingHint
            ? shippingHint
            : inStock === null
              ? null
              : inStock
                ? "auf Lager"
                : "nicht auf Lager"

          const cardWidthClass = compact
            ? "w-[31.5%] min-w-[31.5%] sm:w-[220px] sm:min-w-[220px]"
            : "w-[220px] min-w-[220px]"

          return (
            <div
              key={p._id}
              className={`shrink-0 border border-neutral-200 bg-white rounded-2xl overflow-hidden ${cardWidthClass}`}
            >
              <Link href={href} className="block">
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

                <div className={compact ? "px-3 pt-3 pb-2" : "px-4 pt-3 pb-3"}>
                  <div className="flex flex-wrap gap-2">
                    {stockText ? (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border border-neutral-200 ${
                          compact ? "px-2 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${inStock === false ? "bg-red-500" : "bg-green-500"}`} />
                        {stockText}
                      </span>
                    ) : null}

                    {delivery ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border border-neutral-200 ${
                          compact ? "px-2 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
                        }`}
                      >
                        ⏱ {delivery}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className={`mt-2 font-medium leading-snug line-clamp-3 ${
                      compact ? "text-[12px] min-h-[3.6rem]" : "text-sm min-h-[4.25rem]"
                    }`}
                  >
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

              <div className={compact ? "px-3 pb-3" : "px-4 pb-4"}>
                <button
                  type="button"
                  onClick={() => {
                    add({
                      productId: p._id,
                      title: p?.title ?? "",
                      slug,
                      price: typeof p?.price === "number" ? p.price : null,
                      image: hero ?? null,
                      qty: 1,
                    })
                    setAddedId(p._id)
                    setTimeout(() => setAddedId(null), 900)
                  }}
                  className={`inline-flex w-full justify-center rounded-full bg-black text-white hover:opacity-85 transition ${
                    compact ? "px-3 py-2 text-[12px]" : "px-4 py-2.5 text-sm"
                  }`}
                >
                  {addedId === p._id ? "Im Warenkorb ✅" : "In den Warenkorb"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}