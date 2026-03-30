"use client"

import Link from "next/link"
import ProductRail from "@/components/shop/ProductRail"

export default function ProductSlider({
  title,
  items,
  viewAllHref,
}: {
  title: string
  items: any[]
  viewAllHref?: string
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div className="text-base md:text-lg font-semibold tracking-tight">{title}</div>

        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm text-neutral-600 hover:text-black underline shrink-0">
            Alle ansehen
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        <ProductRail products={items} compact />
      </div>
    </section>
  )
}