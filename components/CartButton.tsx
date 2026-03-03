"use client"

import Link from "next/link"
import {useCart} from "@/lib/cart"

export default function CartButton() {
  const {items} = useCart()

  const count = Array.isArray(items)
    ? items.reduce((sum, x) => sum + (Number((x as any)?.qty) || 0), 0)
    : 0

  return (
    <Link
      href="/cart"
      aria-label="Warenkorb"
      className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2 hover:bg-neutral-50 transition shrink-0 leading-none"
    >
      {/* Cart Icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-black"
      >
        <path d="M6 6h15l-2 8H8L6 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="20" r="1.8" fill="currentColor" />
        <circle cx="18" cy="20" r="1.8" fill="currentColor" />
      </svg>

      {/* Badge */}
      {count > 0 ? (
        <span
          className="ml-1 min-w-[22px] h-[22px] px-2 rounded-full flex items-center justify-center font-semibold shadow-sm leading-none"
          style={{
            background: "#000",
            color: "#fff",
            fontSize: "12px",
          }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  )
}