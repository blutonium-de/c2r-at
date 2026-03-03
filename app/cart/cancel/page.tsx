"use client"

import Link from "next/link"

export default function CartCancelPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-6 pt-14 pb-20">
        <div className="text-sm text-neutral-500">Checkout</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Abgebrochen</h1>

        <div className="mt-8 rounded-3xl border border-neutral-200 p-6">
          <div className="text-neutral-700">PayPal Checkout wurde abgebrochen.</div>

          <div className="mt-6 flex gap-3">
            <Link href="/cart" className="rounded-full bg-black text-white px-5 py-2 text-sm hover:opacity-85">
              Zurück zum Warenkorb
            </Link>
            <Link href="/shop" className="rounded-full border border-neutral-300 px-5 py-2 text-sm hover:border-black">
              Weiter shoppen
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}