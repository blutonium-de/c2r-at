"use client"

import {useMemo, useState} from "react"
import Image from "next/image"
import {urlFor} from "@/sanity/lib/image"

type Props = {
  title: string
  images: any[]
}

export default function ProductGallery({title, images}: Props) {
  const imgs = useMemo(() => (Array.isArray(images) ? images.filter((x) => x?.asset) : []), [images])
  const [idx, setIdx] = useState(0)

  const hasMany = imgs.length > 1
  const hero = imgs[idx]

  function prev() {
    setIdx((i) => (i - 1 + imgs.length) % imgs.length)
  }

  function next() {
    setIdx((i) => (i + 1) % imgs.length)
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden">
      <div className="relative aspect-[16/10] w-full min-w-0 max-w-full rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200">
        {hero ? (
          <Image
            src={urlFor(hero).width(1800).height(1200).url()}
            alt={title ?? "Produkt"}
            fill
            className="object-contain"
            unoptimized
            priority
          />
        ) : null}

        {hasMany ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Vorheriges Bild"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 backdrop-blur border border-neutral-200 px-3 py-2 text-sm hover:bg-white transition"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Nächstes Bild"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 backdrop-blur border border-neutral-200 px-3 py-2 text-sm hover:bg-white transition"
            >
              ›
            </button>

            <div className="absolute bottom-3 right-3 text-[11px] text-neutral-700 bg-white/80 border border-neutral-200 rounded-full px-3 py-1">
              {idx + 1} / {imgs.length}
            </div>
          </>
        ) : null}
      </div>

      {hasMany ? (
        <div className="mt-4 w-full max-w-full overflow-x-auto overflow-y-hidden pb-1">
          <div className="flex w-max gap-3 pr-1">
            {imgs.slice(0, 12).map((img: any, i: number) => {
              const active = i === idx
              return (
                <button
                  key={img?._key ?? i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`relative h-20 w-28 shrink-0 rounded-xl overflow-hidden border bg-neutral-100 transition ${
                    active ? "border-black" : "border-neutral-200 hover:border-black"
                  }`}
                  aria-label={`Bild ${i + 1} anzeigen`}
                >
                  <Image
                    src={urlFor(img).width(400).height(300).url()}
                    alt={`${title ?? "Bild"} ${i + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}