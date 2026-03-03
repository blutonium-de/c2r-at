"use client"

import Link from "next/link"
import {useCart} from "@/lib/cart"
import {useState} from "react"

export default function AddToCart({
  product,
  compact,
}: {
  product: {_id: string; title: string; slug: string; price: number | null; image: any | null}
  compact?: boolean
}) {
  const {add} = useCart()
  const [added, setAdded] = useState(false)

  const btnPrimary =
    "inline-flex w-full justify-center rounded-full bg-black text-white text-sm hover:opacity-85 transition"
  const btnSecondary =
    "inline-flex w-full justify-center rounded-full border border-neutral-300 text-sm hover:border-black transition"

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <button
        type="button"
        onClick={() => {
          add({
            productId: product._id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            image: product.image,
            qty: 1,
          })
          setAdded(true)
          setTimeout(() => setAdded(false), 900)
        }}
        className={`${btnPrimary} ${compact ? "px-4 py-2.5" : "px-5 py-3"}`}
      >
        {added ? "Im Warenkorb ✅" : "In den Warenkorb"}
      </button>

      {/* im Rail lassen wir den 2. Button weg -> weniger gequetscht */}
      {compact ? null : (
        <Link href="/cart" className={`${btnSecondary} px-5 py-3`}>
          Zum Warenkorb
        </Link>
      )}
    </div>
  )
}