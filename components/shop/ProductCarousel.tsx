"use client"

import {useMemo, useRef} from "react"
import Link from "next/link"
import Image from "next/image"
import {urlFor} from "@/sanity/lib/image"
import AddToCart from "@/components/shop/AddToCart"

type ProductCard = {
  _id: string
  title?: string
  slug?: {current?: string} | string
  price?: number | null
  images?: any[]
  image?: any
  condition?: string | null
  deliveryTimeLabel?: string | null
  shippingNote?: string | null
  stock?: number | null
}

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

function getSlug(p: ProductCard) {
  if (typeof p.slug === "string") return p.slug
  return p.slug?.current ?? ""
}

function pickHero(p: ProductCard) {
  const arr = Array.isArray(p.images) ? p.images : []
  const hero = p.image?.asset ? p.image : arr.find((x: any) => x?.asset) ?? null
  return hero
}

function stockInfo(p: ProductCard) {
  const delivery = String(p.deliveryTimeLabel ?? "").trim() || null
  const shippingHint = String(p.shippingNote ?? "").trim() || null

  const stockVal = typeof p.stock === "number" ? p.stock : null
  const inStock = stockVal === null ? null : stockVal > 0

  // Wenn shippingNote wie "auf Lager" / "lagernd" gesetzt ist → als Text verwenden
  const stockText =
    shippingHint && shippingHint.length <= 40
      ? shippingHint
      : inStock === null
        ? null
        : inStock
          ? "Auf Lager"
          : "Nicht auf Lager"

  return {delivery, stockText, inStock}
}

export default function ProductCarousel({
  title,
  items,
}: {
  title: string
  items: ProductCard[]
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const cards = useMemo(() => {
    return (Array.isArray(items) ? items : [])
      .filter((x) => x?._id && getSlug(x))
      .slice(0, 20)
  }, [items])

  function scrollByCards(dir: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    const firstCard = el.querySelector<HTMLElement>("[data-card='1']")
    const w = firstCard?.offsetWidth ?? 260
    el.scrollBy({left: dir * (w * 2), behavior: "smooth"})
  }

  if (!cards.length) return null

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="h-9 w-9 rounded-full border border-neutral-200 hover:border-black transition inline-flex items-center justify-center"
            aria-label="Zurück"
            title="Zurück"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="h-9 w-9 rounded-full border border-neutral-200 hover:border-black transition inline-flex items-center justify-center"
            aria-label="Weiter"
            title="Weiter"
          >
            →
          </button>
        </div>
      </div>

      {/* AutoDoc-Style: 5 schlanke Cards sichtbar + horizontal scroll */}
      <div className="mt-5 relative">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {cards.map((p, idx) => {
            const slug = getSlug(p)
            const href = `/shop/${encodeURIComponent(slug)}`
            const hero = pickHero(p)
            const condLabel =
              p?.condition === "neu" ? "Neu" : p?.condition === "gebraucht" ? "Gebraucht" : null

            const {delivery, stockText, inStock} = stockInfo(p)

            return (
              <div
                key={p._id}
                data-card="1"
                className="
                  shrink-0
                  basis-[78%]
                  sm:basis-[46%]
                  md:basis-[30%]
                  lg:basis-[19%]
                "
                style={{scrollSnapAlign: "start"}}
              >
                <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
                  <Link href={href} className="block">
                    <div className="relative aspect-[4/3] bg-neutral-100">
                      {hero ? (
                        <Image
                          src={urlFor(hero).width(900).height(700).url()}
                          alt={p?.title ?? "Produkt"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}

                      {condLabel ? (
                        <div className="absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-full bg-white/90 border border-neutral-200">
                          {condLabel}
                        </div>
                      ) : null}
                    </div>
                  </Link>

                  <div className="p-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {stockText ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px]">
                          <span className={`h-2 w-2 rounded-full ${inStock === false ? "bg-red-500" : "bg-green-500"}`} />
                          <span className="text-neutral-700">{stockText}</span>
                        </div>
                      ) : null}

                      {delivery ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px]">
                          <span>⏱</span>
                          <span className="text-neutral-700">{delivery}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Title */}
                    <Link href={href} className="mt-3 block">
                      <div className="text-sm font-medium leading-snug line-clamp-2 hover:underline">
                        {p?.title ?? "Produkt"}
                      </div>
                    </Link>

                    {/* Price */}
                    <div className="mt-2 text-sm font-semibold">
                      {typeof p?.price === "number" ? `${money(p.price)} €` : "Preis auf Anfrage"}
                    </div>

                    {/* Cart */}
                    <div className="mt-3">
                      <AddToCart
  product={{
    _id: p._id,
    title: p.title ?? "Produkt",
    slug: slug,
    price: typeof p.price === "number" ? p.price : null,
    image: hero ?? null,
  }}
/>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}