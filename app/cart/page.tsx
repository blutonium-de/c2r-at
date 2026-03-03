"use client"

import Link from "next/link"
import Image from "next/image"
import {useCart} from "@/lib/cart"
import {urlFor} from "@/sanity/lib/image"

export default function CartPage() {
  const {items, setQty, remove, subtotal, clear} = useCart()

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-20">
        <div className="text-sm text-neutral-500">Warenkorb</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">Dein Warenkorb</h1>

        {!items.length ? (
          <div className="mt-10 text-neutral-600">
            Warenkorb ist leer.{" "}
            <Link href="/shop" className="underline hover:text-black">
              Zum Shop →
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 space-y-4">
              {items.map((x) => {
                const deliveryTimeLabel = (x as any)?.deliveryTimeLabel as string | undefined
                const shippingNote = (x as any)?.shippingNote as string | undefined

                return (
                  <div key={x.key} className="rounded-3xl border border-neutral-200 p-5 flex gap-4 items-start">
                    <div className="relative h-20 w-28 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                      {x.image?.asset ? (
                        <Image
                          src={urlFor(x.image).width(400).height(300).url()}
                          alt={x.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold truncate">{x.title}</div>

                      <div className="mt-1 text-sm text-neutral-600">
                        {typeof x.price === "number" ? `${x.price} €` : "Preis auf Anfrage"}
                        {deliveryTimeLabel ? ` · ${deliveryTimeLabel}` : ""}
                      </div>

                      {shippingNote ? <div className="mt-1 text-xs text-neutral-500">{shippingNote}</div> : null}

                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-sm text-neutral-600">Menge</label>
                        <input
                          type="number"
                          min={1}
                          className="w-20 rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-black"
                          value={x.qty}
                          onChange={(e) => setQty(x.key, Number(e.target.value || 1))}
                        />

                        <button
                          type="button"
                          className="text-sm text-neutral-600 underline hover:text-black"
                          onClick={() => remove(x.key)}
                        >
                          Entfernen
                        </button>
                      </div>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <div className="text-sm text-neutral-500">Summe</div>
                      <div className="text-base font-semibold">
                        {typeof x.price === "number" ? `${x.price * x.qty} €` : "—"}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 rounded-3xl border border-neutral-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="text-sm text-neutral-500">Zwischensumme</div>
                <div className="text-2xl font-semibold">{subtotal} €</div>
                <div className="mt-2 text-xs text-neutral-500">
                  Versand wird an der Kasse berechnet (AT/EU). Preise inkl. MwSt.
                </div>

                <button
                  type="button"
                  className="mt-3 text-sm text-neutral-600 underline hover:text-black"
                  onClick={clear}
                >
                  Warenkorb leeren
                </button>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm hover:border-black transition"
                >
                  Weiter shoppen
                </Link>

                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 text-sm hover:opacity-85 transition"
                >
                  Zur Kasse
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}