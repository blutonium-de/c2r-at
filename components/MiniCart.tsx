"use client"

import Link from "next/link"
import Image from "next/image"
import {useMemo, useState} from "react"
import {useCart} from "@/lib/cart"
import {urlFor} from "@/sanity/lib/image"

function money(n: any) {
  const x = Number(n)
  if (!Number.isFinite(x)) return "0.00"
  return (Math.round(x * 100) / 100).toFixed(2)
}

export default function MiniCart() {
  const {items, subtotal} = useCart()
  const [open, setOpen] = useState(false)

  const count = useMemo(() => {
    return Array.isArray(items) ? items.reduce((sum, x: any) => sum + (Number(x?.qty) || 0), 0) : 0
  }, [items])

  const topItems = useMemo(() => (Array.isArray(items) ? items.slice(0, 5) : []), [items])

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-label="Warenkorb"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2 hover:bg-neutral-50 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-black">
          <path d="M6 6h15l-2 8H8L6 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="20" r="1.8" fill="currentColor" />
          <circle cx="18" cy="20" r="1.8" fill="currentColor" />
        </svg>

        {count > 0 ? (
          <span className="min-w-[22px] h-[22px] px-2 rounded-full bg-black text-white text-[12px] flex items-center justify-center font-semibold shadow-sm">
            {count}
          </span>
        ) : (
          <span className="text-xs text-neutral-600">0</span>
        )}
      </button>

      {open ? (
        <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-20 md:top-full pt-2 z-50">
          <div className="w-full md:w-[360px] rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-100">
              <div className="text-sm font-semibold">Warenkorb</div>
              <div className="text-xs text-neutral-500">{count} Artikel</div>
            </div>

            {!topItems.length ? (
              <div className="p-4 text-sm text-neutral-600">
                Warenkorb ist leer.{" "}
                <Link href="/shop" className="underline hover:text-black" onClick={() => setOpen(false)}>
                  Zum Shop →
                </Link>
              </div>
            ) : (
              <>
                <div className="max-h-[280px] overflow-auto p-4 space-y-3">
                  {topItems.map((x: any) => (
                    <div key={x.key} className="flex gap-3 items-start">
                      <div className="relative h-14 w-16 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                        {x.image?.asset ? (
                          <Image
                            src={urlFor(x.image).width(300).height(300).url()}
                            alt={x.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{x.title}</div>
                        <div className="text-xs text-neutral-600 mt-0.5">
                          {typeof x.price === "number" ? `${money(x.price)} €` : "Preis auf Anfrage"} · Menge {x.qty}
                        </div>
                      </div>

                      <div className="text-sm font-semibold whitespace-nowrap">
                        {typeof x.price === "number" ? `${money(x.price * x.qty)} €` : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-600">Zwischensumme</div>
                    <div className="text-lg font-semibold">{money(subtotal)} €</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href="/cart"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-black transition"
                    >
                      Zum Warenkorb
                    </Link>

                    <Link
                      href="/checkout"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-full bg-black text-white px-4 py-2 text-sm hover:opacity-85 transition"
                    >
                      Checkout
                    </Link>
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-500">
                    Versand wird im Checkout berechnet (AT/EU).
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}