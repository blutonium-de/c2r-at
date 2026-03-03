"use client"

import {useEffect, useState} from "react"
import Link from "next/link"
import {hasCookieBannerConsent, setCookieBannerConsent} from "@/lib/consent"

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // nur im Browser prüfen
    const ok = hasCookieBannerConsent()
    setShow(!ok)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[999] p-4">
      <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white shadow-lg px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-neutral-700">
            Wir verwenden <span className="font-medium">nur notwendige Cookies</span> (z.B. für Warenkorb/Checkout).
            Mehr dazu in{" "}
            <Link href="/datenschutz" className="underline hover:text-black">
              Datenschutz
            </Link>
            .
          </div>

          <button
            type="button"
            onClick={() => {
              setCookieBannerConsent()
              setShow(false)
            }}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-white text-sm hover:opacity-85 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}