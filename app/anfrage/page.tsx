"use client"

import Link from "next/link"
import React, {Suspense, useMemo, useRef, useState} from "react"
import {useSearchParams} from "next/navigation"

function AnfrageInner() {
  const sp = useSearchParams()

  const miete = useMemo(() => (sp.get("miete") ?? "").trim(), [sp])
  const rentalObjectId = useMemo(() => (sp.get("id") ?? "").trim(), [sp])

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submittedOnceRef = useRef(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    startDate: "",
    endDate: "",
    message: "",
    consent: true,
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({...p, [key]: value}))
  }

  function isBefore(a: string, b: string) {
    if (!a || !b) return false
    return a < b
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (loading || done || submittedOnceRef.current) return

    setError(null)

    if (form.startDate && form.endDate && isBefore(form.endDate, form.startDate)) {
      setError("Das Bis-Datum darf nicht vor dem Von-Datum liegen.")
      return
    }

    if (!form.consent) {
      setError("Bitte stimme der Verarbeitung zu.")
      return
    }

    setLoading(true)

    try {
      // ✅ Payload flexibel bauen (Mietobjekt optional)
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        from: form.startDate,
        to: form.endDate,
        message: form.message || undefined,
        consent: form.consent,
      }

      if (rentalObjectId) payload.rentalObjectId = rentalObjectId
      if (miete) payload.rentalObjectTitle = miete

      const res = await fetch("/api/anfrage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        const msg = [json?.error, json?.details ? `Details: ${json.details}` : null]
          .filter(Boolean)
          .join(" — ")
        setError(msg || "Unbekannter Fehler")
        return
      }

      submittedOnceRef.current = true
      setDone(true)
    } catch (err: any) {
      setError(err?.message ?? "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  function resetFormForNewRequest() {
    submittedOnceRef.current = false
    setDone(false)
    setError(null)
    setLoading(false)
    setForm({
      name: "",
      email: "",
      phone: "",
      startDate: "",
      endDate: "",
      message: "",
      consent: true,
    })
  }

  const disabled = loading || done

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <div className="text-sm text-neutral-500">Anfrage</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
          Jetzt unverbindlich anfragen
        </h1>

        {miete ? (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              Miet-Objekt
            </div>
            <div className="mt-1 text-lg font-semibold text-neutral-900">
              {miete}
            </div>
            <div className="mt-3 h-px w-full bg-neutral-200" />
          </div>
        ) : (
          <div className="mt-4 text-sm text-neutral-500">
            (Kein Miet-Objekt ausgewählt – du kannst trotzdem anfragen.)
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-neutral-200 p-6">
          <div className={`grid md:grid-cols-2 gap-4 ${done ? "opacity-60" : ""}`}>
            <label className="block">
              <div className="text-sm text-neutral-600">Name *</div>
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black disabled:bg-neutral-50"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                disabled={disabled}
              />
            </label>

            <label className="block">
              <div className="text-sm text-neutral-600">E-Mail *</div>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black disabled:bg-neutral-50"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                disabled={disabled}
              />
            </label>

            <label className="block">
              <div className="text-sm text-neutral-600">Telefon (optional)</div>
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black disabled:bg-neutral-50"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                disabled={disabled}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <div className="text-sm text-neutral-600">Von</div>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black disabled:bg-neutral-50"
                  value={form.startDate}
                  disabled={disabled}
                  onChange={(e) => {
                    const nextStart = e.target.value
                    setForm((p) => {
                      const nextEnd =
                        p.endDate && nextStart && isBefore(p.endDate, nextStart)
                          ? nextStart
                          : p.endDate
                      return {...p, startDate: nextStart, endDate: nextEnd}
                    })
                  }}
                />
              </label>

              <label className="block">
                <div className="text-sm text-neutral-600">Bis</div>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black disabled:bg-neutral-50"
                  value={form.endDate}
                  min={form.startDate || undefined}
                  onChange={(e) => set("endDate", e.target.value)}
                  disabled={disabled}
                />
              </label>
            </div>
          </div>

          <label className={`block mt-4 ${done ? "opacity-60" : ""}`}>
            <div className="text-sm text-neutral-600">Nachricht (optional)</div>
            <textarea
              className="mt-1 w-full min-h-[120px] rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-black disabled:bg-neutral-50"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Wunschzeitraum, Fragen, Besonderheiten…"
              disabled={disabled}
            />
          </label>

          <label className={`mt-4 flex items-start gap-3 text-sm text-neutral-600 ${done ? "opacity-60" : ""}`}>
            <input
              type="checkbox"
              className="mt-1"
              checked={form.consent}
              onChange={(e) => set("consent", e.target.checked)}
              disabled={disabled}
            />
            <span>
              Ich stimme zu, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden.
            </span>
          </label>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {done ? (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Anfrage gesendet ✅ Wir melden uns in Kürze.
            </div>
          ) : null}

          {!done ? (
            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex w-full justify-center px-5 py-3 rounded-full bg-black text-white text-sm hover:opacity-85 transition disabled:opacity-50"
            >
              {loading ? "Sende…" : "Anfrage senden"}
            </button>
          ) : (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/miete"
                className="inline-flex w-full sm:w-auto justify-center px-5 py-3 rounded-full border border-neutral-300 text-sm hover:border-black transition"
              >
                Zurück zur Mietauswahl
              </Link>
              <button
                type="button"
                onClick={resetFormForNewRequest}
                className="inline-flex w-full sm:w-auto justify-center px-5 py-3 rounded-full bg-black text-white text-sm hover:opacity-85 transition"
              >
                Neue Anfrage
              </button>
            </div>
          )}

          <div className="mt-3 text-xs text-neutral-500">
            Abholung/Übergabe: Lambach (OÖ)
          </div>
        </form>
      </div>
    </main>
  )
}

export default function AnfragePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-black">
          <div className="max-w-3xl mx-auto px-6 pt-10 pb-20 text-neutral-600">
            Lade Anfrage…
          </div>
        </main>
      }
    >
      <AnfrageInner />
    </Suspense>
  )
}