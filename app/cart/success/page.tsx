"use client"

import Link from "next/link"
import {Suspense, useEffect, useState} from "react"
import {useSearchParams} from "next/navigation"
import {useCart} from "@/lib/cart"

function SuccessInner() {
  const sp = useSearchParams()
  const token = sp.get("token") // PayPal orderId kommt als token
  const {clear} = useCart()

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!token) {
        setStatus("error")
        setMessage("PayPal Token fehlt.")
        return
      }

      const res = await fetch("/api/checkout/paypal/capture", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({orderId: token}),
      })

      const json = await res.json().catch(() => ({} as any))
      if (cancelled) return

      if (!res.ok) {
        setStatus("error")
        setMessage(json?.error || "Capture fehlgeschlagen.")
        return
      }

      // ✅ Cart leeren
      clear()
      setStatus("ok")
      setMessage("Zahlung erfolgreich. Danke!")
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token, clear])

  return (
    <div className="mt-8 rounded-3xl border border-neutral-200 p-6">
      {status === "loading" ? (
        <div className="text-neutral-700">Verarbeite PayPal Zahlung…</div>
      ) : status === "ok" ? (
        <div className="text-neutral-800">{message}</div>
      ) : (
        <div className="text-neutral-800">
          <div className="font-medium">Fehler</div>
          <div className="mt-2 text-neutral-600">{message}</div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/shop" className="rounded-full border border-neutral-300 px-5 py-2 text-sm hover:border-black">
          Zurück zum Shop
        </Link>
        <Link href="/cart" className="rounded-full bg-black text-white px-5 py-2 text-sm hover:opacity-85">
          Zum Warenkorb
        </Link>
      </div>
    </div>
  )
}

export default function CartSuccessPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-6 pt-14 pb-20">
        <div className="text-sm text-neutral-500">Checkout</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Ergebnis</h1>

        {/* ✅ Fix für Next build: useSearchParams innerhalb Suspense */}
        <Suspense
          fallback={
            <div className="mt-8 rounded-3xl border border-neutral-200 p-6 text-neutral-700">
              Verarbeite PayPal Zahlung…
            </div>
          }
        >
          <SuccessInner />
        </Suspense>
      </div>
    </main>
  )
}