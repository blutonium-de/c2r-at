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
    <section className="max-w-6xl mx-auto px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold">{title}</div>

        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm text-neutral-600 hover:text-black underline">
            Alle ansehen
          </Link>
        ) : (
          <span />
        )}
      </div>

      <div className="mt-3">
        <ProductRail products={items} />
      </div>
    </section>
  )
}