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

  // ✅ stabile clear()-Referenz (verhindert Probleme bei instabilen Hook-Referenzen)
  const clearRef = useRef(cart.clear)
  useEffect(() => {
    clearRef.current = cart.clear
  }, [cart.clear])

  const didRun = useRef(false)
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle")

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    ;(async () => {
      try {
        // ✅ STRIPE: wenn session_id vorhanden → direkt leeren
        if (sessionId) {
          clearRef.current()
          setStatus("done")
          return
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
          setStatus("done")
          return
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

        {status === "working" ? <p className="mt-3 text-sm text-neutral-600">Zahlung wird bestätigt…</p> : null}

        {status === "error" ? (
          <p className="mt-3 text-sm text-red-600">
            Zahlung konnte nicht final bestätigt werden. Bitte kurz melden.
          </p>
        ) : null}

        {sessionId ? (
          <p className="mt-3 text-xs text-neutral-500 break-all">Stripe Session: {sessionId}</p>
        ) : null}

        {paypalToken ? (
          <p className="mt-3 text-xs text-neutral-500 break-all">PayPal Order: {paypalToken}</p>
        ) : null}

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
      </div>
    </main>
  )
}