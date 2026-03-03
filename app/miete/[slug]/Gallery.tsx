"use client"

import Image from "next/image"
import {useMemo, useState} from "react"

type SanityImage = {
  _key?: string
  asset?: any
}

type Props = {
  name: string
  bilder: SanityImage[]
  urlFor: (source: any) => {width: (n: number) => any; height: (n: number) => any; url: () => string}
}

export default function Gallery({name, bilder, urlFor}: Props) {
  const images = useMemo(() => (Array.isArray(bilder) ? bilder.filter(Boolean) : []), [bilder])
  const [active, setActive] = useState(0)

  const hero = images[active] ?? images[0]

  return (
    <div>
      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200">
        {hero ? (
          <Image
            src={urlFor(hero).width(1600).height(1000).url()}
            alt={name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => {
            const isActive = idx === active
            return (
              <button
                key={img._key ?? String(idx)}
                type="button"
                onClick={() => setActive(idx)}
                className={[
                  "relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border",
                  isActive ? "border-black" : "border-neutral-200 hover:border-neutral-400",
                ].join(" ")}
                aria-label={`Bild ${idx + 1}`}
              >
                <Image
                  src={urlFor(img).width(320).height(240).url()}
                  alt={`${name} – Bild ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}