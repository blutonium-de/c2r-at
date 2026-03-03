"use client"

import {useEffect, useRef, useState} from "react"
import Link from "next/link"
import {useCart} from "@/lib/cart"

type Props = {
  sessionId: string | null
  paypalFlag: string | null
  paypalToken: string | null
}

export default function CheckoutSuccessClient({sessionId, paypalFlag, paypalToken}: Props) {
  const cart = useCart()

  // ✅ stabile clear()-Referenz
  const clearRef = useRef(cart.clear)
  useEffect(() => {
    clearRef.current = cart.clear
  }, [cart.clear])

  const didRun = useRef(false)
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(sessionId ? "working" : "idle")

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    ;(async () => {
      try {
        // ✅ STRIPE: wenn session_id vorhanden → sofort leeren (mit Safety-2nd pass)
        if (sessionId) {
          setStatus("working")
          clearRef.current()
          const t = setTimeout(() => {
            clearRef.current()
          }, 250)
          setStatus("done")
          return () => clearTimeout(t)
        }

        // ✅ PAYPAL: wenn paypal=1 & token vorhanden → capture aufrufen
        if (paypalFlag === "1" && paypalToken) {
          setStatus("working")

          const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({paypalOrderId: paypalToken}),
          })

          const json = await res.json().catch(() => ({} as any))

          if (!res.ok) {
            console.error("PayPal capture failed:", json)
            setStatus("error")
            return
          }

          clearRef.current()
          const t = setTimeout(() => {
            clearRef.current()
          }, 250)

          setStatus("done")
          return () => clearTimeout(t)
        }

        setStatus("done")
      } catch (err) {
        console.error(err)
        setStatus("error")
      }
    })()
  }, [sessionId, paypalFlag, paypalToken])

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        <div className="text-sm text-neutral-500">Checkout</div>

        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">Zahlung erfolgreich ✅</h1>

        <p className="mt-6 text-neutral-600">Danke! Wir haben deine Bestellung erhalten.</p>

        {status === "working" ? <p className="mt-3 text-sm text-neutral-600">Bestellung wird finalisiert…</p> : null}

        {status === "error" ? (
          <p className="mt-3 text-sm text-red-600">Zahlung konnte nicht final bestätigt werden. Bitte kurz melden.</p>
        ) : null}

        {sessionId ? <p className="mt-3 text-xs text-neutral-500 break-all">Stripe Session: {sessionId}</p> : null}
        {paypalToken ? <p className="mt-3 text-xs text-neutral-500 break-all">PayPal Order: {paypalToken}</p> : null}

        {/* Buttons erst anzeigen, wenn Cart sicher geleert ist */}
        {status === "done" ? (
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm hover:border-black transition"
            >
              Weiter shoppen
            </Link>

            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-6 py-3 text-sm hover:opacity-85 transition"
            >
              Zum Warenkorb
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm hover:border-black transition"
            >
              Weiter shoppen
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}