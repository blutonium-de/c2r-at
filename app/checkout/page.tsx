"use client"

import {useEffect, useMemo, useState} from "react"
import Link from "next/link"
import Image from "next/image"
import {useCart} from "@/lib/cart"
import {urlFor} from "@/sanity/lib/image"

type QuoteOption = {
  id: string
  title: string
  region: "AT" | "EU"
  price: number
  freeFrom?: number | null
  cost: number
}

type QuoteResponse =
  | {
      ok: true
      subtotal: number
      shippingOptions: QuoteOption[]
      selectedShippingId: string | null
      shippingCost: number
      total: number
      tax: number
      vatRate: number
      deliveryHint?: string | null
      reverseChargeApplied?: boolean
      vatValidated?: boolean
      vatValidationMessage?: string | null
      vatCompanyName?: string | null
      vatCompanyAddress?: string | null
      subtotalGross?: number
      shippingCostGross?: number
      totalGross?: number
    }
  | {ok: false; error: string; details?: any}

function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

function short(s: string, n = 40) {
  const str = String(s ?? "")
  return str.length > n ? str.slice(0, n) + "…" : str
}

export default function CheckoutPage() {
  const {items, subtotal} = useCart()

  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  const [region, setRegion] = useState<"AT" | "EU">("AT")
  const [line1, setLine1] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("AT")

  const [billingSame, setBillingSame] = useState(true)

  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [vatId, setVatId] = useState("")

  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [selectedShippingProfileId, setSelectedShippingProfileId] = useState<string>("")
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<"stripe" | "paypal" | null>(null)

  const cartPayload = useMemo(() => {
    return items.map((x: any) => ({productId: x.productId, qty: Number(x.qty) || 1}))
  }, [items])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!cartPayload.length) {
        setQuote({ok: false, error: "Warenkorb ist leer."})
        setSelectedShippingProfileId("")
        return
      }

      setLoadingQuote(true)
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            action: "quote",
            region,
            customer: {
              isBusiness: isCompany,
              companyName: isCompany ? companyName : null,
              vatId: isCompany ? vatId : null,
            },
            items: cartPayload,
          }),
        })

        const json = (await res.json().catch(() => ({}))) as QuoteResponse
        if (cancelled) return

        setQuote(json)

        if (json && (json as any).ok) {
          const q = json as Extract<QuoteResponse, {ok: true}>
          const stillValid = q.shippingOptions.some((x) => x.id === selectedShippingProfileId)
          if (!selectedShippingProfileId || !stillValid) {
            setSelectedShippingProfileId(q.selectedShippingId ?? q.shippingOptions[0]?.id ?? "")
          }
        } else {
          setSelectedShippingProfileId("")
        }
      } finally {
        if (!cancelled) setLoadingQuote(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, cartPayload, isCompany, companyName, vatId])

  const shippingOptions = quote && quote.ok ? quote.shippingOptions : []
  const chosen = shippingOptions.find((x) => x.id === selectedShippingProfileId) || null

  const calcSubtotal = quote && quote.ok ? quote.subtotal : subtotal
  const shippingCost = quote && quote.ok ? (chosen ? chosen.cost : quote.shippingCost) : 0
  const total = quote && quote.ok ? quote.total : calcSubtotal + shippingCost
  const taxAmount = quote && quote.ok ? quote.tax : 0

  const reverseChargeApplied = quote && quote.ok ? !!quote.reverseChargeApplied : false
  const vatValidated = quote && quote.ok ? !!quote.vatValidated : false
  const vatValidationMessage = quote && quote.ok ? quote.vatValidationMessage : null
  const vatCompanyName = quote && quote.ok ? quote.vatCompanyName : null
  const vatCompanyAddress = quote && quote.ok ? quote.vatCompanyAddress : null
  const subtotalGross = quote && quote.ok ? quote.subtotalGross ?? calcSubtotal : calcSubtotal
  const totalGross = quote && quote.ok ? quote.totalGross ?? total : total

  function validateCheckoutBasics() {
    if (!items.length) return "Warenkorb ist leer."
    if (!email.trim()) return "Bitte E-Mail eingeben."
    if (!fullName.trim()) return "Bitte Name eingeben."
    if (!line1.trim() || !postalCode.trim() || !city.trim()) return "Bitte Lieferadresse vollständig eingeben."
    if (!selectedShippingProfileId) return "Bitte Versand auswählen."
    if (isCompany && !companyName.trim()) return "Bitte Firmenname eingeben."
    if (isCompany && region === "EU" && !vatId.trim()) return "Bitte UID / VAT ID eingeben."
    return null
  }

  async function doCheckout(provider: "stripe" | "paypal") {
    const err = validateCheckoutBasics()
    if (err) {
      alert(err)
      return
    }

    setCheckoutLoading(provider)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          action: "create",
          provider,
          region,
          shippingProfileId: selectedShippingProfileId,
          customer: {
            email,
            phone: phone || null,
            fullName,
            isBusiness: isCompany,
            companyName: isCompany ? companyName : null,
            vatId: isCompany ? vatId : null,
          },
          shippingAddress: {
            fullName,
            line1,
            postalCode,
            city,
            country,
          },
          items: cartPayload,
        }),
      })

      const json = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        alert(json?.error || "Checkout fehlgeschlagen")
        return
      }

      if (provider === "paypal" && json?.approveUrl) {
        window.location.href = json.approveUrl
        return
      }

      if (json?.url) {
        window.location.href = json.url
        return
      }

      alert("Kein Redirect erhalten.")
    } finally {
      setCheckoutLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-white text-black overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-14 pb-20">
        <div className="text-sm text-neutral-500">Checkout</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight break-words">
          Bestellung abschließen
        </h1>

        {!items.length ? (
          <div className="mt-10 text-neutral-600">
            Warenkorb ist leer.{" "}
            <Link href="/shop" className="underline hover:text-black">
              Zum Shop →
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_.8fr] min-w-0">
            {/* LEFT */}
            <section className="space-y-10 min-w-0">
              {/* Kontakt */}
              <div className="rounded-3xl border border-neutral-200 p-6 min-w-0">
                <div className="text-lg font-semibold">Kontakt</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 min-w-0">
                  <div className="min-w-0">
                    <label className="text-sm text-neutral-600">E-Mail *</label>
                    <input
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                      type="email"
                      inputMode="email"
                      placeholder="name@email.com"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="text-sm text-neutral-600">Name *</label>
                    <input
                      name="fullName"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                      type="text"
                      placeholder="Vorname Nachname"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="text-sm text-neutral-600">Telefon (optional)</label>
                    <input
                      name="phone"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                      type="tel"
                      inputMode="tel"
                      placeholder="+43 ..."
                    />
                  </div>
                </div>
              </div>

              {/* Lieferadresse */}
              <div className="rounded-3xl border border-neutral-200 p-6 min-w-0">
                <div className="text-lg font-semibold">Lieferadresse</div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 min-w-0">
                  <div className="min-w-0">
                    <label className="text-sm text-neutral-600">Region *</label>
                    <select
                      name="region"
                      autoComplete="shipping country"
                      value={region}
                      onChange={(e) => {
                        const v = e.target.value as "AT" | "EU"
                        setRegion(v)
                        setCountry(v)
                      }}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black bg-white"
                    >
                      <option value="AT">Österreich (AT)</option>
                      <option value="EU">EU (alle übrigen EU Länder)</option>
                    </select>
                    <div className="mt-1 text-xs text-neutral-500">
                      Versand nur innerhalb EU (keine Nicht-EU Länder).
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="text-sm text-neutral-600">PLZ *</label>
                    <input
                      name="postalCode"
                      autoComplete="shipping postal-code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                      type="text"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="md:col-span-2 min-w-0">
                    <label className="text-sm text-neutral-600">Straße + Hausnr. *</label>
                    <input
                      name="addressLine1"
                      autoComplete="shipping address-line1"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                      type="text"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="text-sm text-neutral-600">Ort *</label>
                    <input
                      name="city"
                      autoComplete="shipping address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              {/* Firma */}
              <div className="rounded-3xl border border-neutral-200 p-6 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">Kauf als Firma (optional)</div>
                    <div className="text-sm text-neutral-600">
                      Preise sind standardmäßig inkl. MwSt. Bei gültiger EU-UID außerhalb AT wird automatisch netto gerechnet.
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm shrink-0">
                    <input
                      type="checkbox"
                      checked={isCompany}
                      onChange={(e) => setIsCompany(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Firma
                  </label>
                </div>

                {isCompany ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 min-w-0">
                    <div className="min-w-0">
                      <label className="text-sm text-neutral-600">Firma *</label>
                      <input
                        name="companyName"
                        autoComplete="organization"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                        type="text"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="text-sm text-neutral-600">
                        UID / VAT ID {region === "EU" ? "*" : "(optional)"}
                      </label>
                      <input
                        name="vatId"
                        autoComplete="off"
                        value={vatId}
                        onChange={(e) => setVatId(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                        className="mt-1 w-full min-w-0 rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-black"
                        type="text"
                        placeholder={region === "EU" ? "z.B. DE123456789" : "z.B. DE123456789"}
                      />
                    </div>
                  </div>
                ) : null}

                {isCompany && region === "EU" ? (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                      reverseChargeApplied
                        ? "border-green-200 bg-green-50 text-green-800"
                        : vatId.trim()
                          ? vatValidated
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-neutral-200 bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    {reverseChargeApplied ? (
                      <div className="space-y-1">
                        <div className="font-medium">UID erfolgreich geprüft – innergemeinschaftliche Lieferung</div>
                        <div>Die Bestellung wird netto abgerechnet. MwSt. = 0,00 €.</div>
                        {vatCompanyName ? <div>Firma laut VIES: {vatCompanyName}</div> : null}
                        {vatCompanyAddress ? <div className="whitespace-pre-line">{vatCompanyAddress}</div> : null}
                      </div>
                    ) : vatId.trim() ? (
                      <div className="space-y-1">
                        <div className="font-medium">UID-Prüfung</div>
                        <div>{vatValidationMessage || "UID wird geprüft oder ist nicht für Netto-Verkauf gültig."}</div>
                      </div>
                    ) : (
                      <div>
                        Für eine umsatzsteuerfreie innergemeinschaftliche Lieferung bitte eine gültige EU-UID eingeben.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Rechnungsadresse (MVP: wie Lieferung) */}
              <div className="rounded-3xl border border-neutral-200 p-6 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">Rechnungsadresse</div>
                    <div className="text-sm text-neutral-600">MVP: wie Lieferadresse.</div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm opacity-60 shrink-0">
                    <input
                      type="checkbox"
                      checked={billingSame}
                      onChange={(e) => setBillingSame(e.target.checked)}
                      className="h-4 w-4"
                      disabled
                    />
                    gleich wie Lieferung
                  </label>
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <aside className="space-y-6 min-w-0">
              <div className="rounded-3xl border border-neutral-200 p-6 min-w-0">
                <div className="text-lg font-semibold">Deine Bestellung</div>

                <div className="mt-5 space-y-4 min-w-0">
                  {items.map((x: any) => (
                    <div key={x.key} className="flex gap-3 items-start min-w-0">
                      <div className="relative h-16 w-20 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
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
                        <div className="text-sm font-medium truncate" title={x.title}>
                          {short(x.title, 40)}
                        </div>

                        <div className="text-xs text-neutral-600 mt-1">
                          Menge {x.qty} · {typeof x.price === "number" ? `${x.price} €` : "Preis auf Anfrage"}
                        </div>
                      </div>

                      <div className="text-sm font-semibold whitespace-nowrap shrink-0">
                        {typeof x.price === "number" ? `${money(x.price * x.qty)} €` : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-neutral-200 pt-5 space-y-3 min-w-0">
                  {reverseChargeApplied ? (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                      Innergemeinschaftliche Lieferung – umsatzsteuerfrei.
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                    <span className="text-neutral-600">
                      {reverseChargeApplied ? "Zwischensumme netto" : "Zwischensumme"}
                    </span>
                    <span className="font-semibold whitespace-nowrap shrink-0">{money(calcSubtotal)} €</span>
                  </div>

                  {reverseChargeApplied ? (
                    <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                      <span className="text-neutral-600">Zwischensumme brutto</span>
                      <span className="whitespace-nowrap shrink-0">{money(subtotalGross)} €</span>
                    </div>
                  ) : null}

                  {/* Versand */}
                  <div className="rounded-2xl border border-neutral-200 p-4 min-w-0">
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="text-sm font-semibold">Versand</div>
                      {loadingQuote ? <div className="text-xs text-neutral-500 shrink-0">lädt…</div> : null}
                    </div>

                    {quote && !quote.ok ? <div className="mt-2 text-sm text-red-600">{quote.error}</div> : null}

                    {quote && quote.ok ? (
                      <>
                        {quote.deliveryHint ? (
                          <div className="mt-2 text-xs text-neutral-500 break-words">{quote.deliveryHint}</div>
                        ) : null}

                        <div className="mt-3 space-y-2 min-w-0">
                          {shippingOptions.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 px-4 py-3 cursor-pointer hover:border-black transition min-w-0 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <input
                                  type="radio"
                                  name="shipping"
                                  className="mt-1 shrink-0"
                                  checked={selectedShippingProfileId === opt.id}
                                  onChange={() => setSelectedShippingProfileId(opt.id)}
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium break-words">{opt.title}</div>
                                  <div className="text-xs text-neutral-600 break-words">
                                    Region {opt.region}
                                    {typeof opt.freeFrom === "number" ? ` · frei ab ${opt.freeFrom} €` : ""}
                                  </div>
                                </div>
                              </div>

                              <div className="text-sm font-semibold whitespace-nowrap shrink-0 self-end sm:self-auto">
                                {opt.cost === 0 ? "Gratis" : `${money(opt.cost)} €`}
                              </div>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                    <span className="text-neutral-600">MwSt.</span>
                    <span className="whitespace-nowrap shrink-0">{money(taxAmount)} €</span>
                  </div>

                  <div className="flex items-center justify-between text-base gap-3 min-w-0">
                    <span className="text-neutral-600">{reverseChargeApplied ? "Gesamt netto" : "Gesamt"}</span>
                    <span className="text-xl font-semibold whitespace-nowrap shrink-0">{money(total)} €</span>
                  </div>

                  {reverseChargeApplied ? (
                    <div className="flex items-center justify-between text-sm gap-3 min-w-0">
                      <span className="text-neutral-600">Gesamt brutto</span>
                      <span className="whitespace-nowrap shrink-0">{money(totalGross)} €</span>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => doCheckout("paypal")}
                      disabled={checkoutLoading !== null}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-3 text-sm hover:border-black transition disabled:opacity-50"
                    >
                      PayPal
                    </button>

                    <button
                      type="button"
                      onClick={() => doCheckout("stripe")}
                      disabled={checkoutLoading !== null}
                      className="inline-flex flex-col items-center justify-center gap-1 rounded-full bg-black text-white px-4 py-3 text-sm hover:opacity-85 transition disabled:opacity-50"
                    >
                      <span>{checkoutLoading === "stripe" ? "Lädt…" : "Kreditkarte"}</span>

                      {checkoutLoading !== "stripe" ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-flex h-5 min-w-[34px] items-center justify-center rounded bg-white px-1.5 text-[10px] font-bold tracking-wide text-blue-700">
                            VISA
                          </span>
                          <span className="inline-flex h-5 min-w-[34px] items-center justify-center rounded bg-white px-1.5 text-[10px] font-bold tracking-wide text-red-600">
                            MC
                          </span>
                        </span>
                      ) : null}
                    </button>
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-500 break-words">
                    {reverseChargeApplied
                      ? "Innergemeinschaftliche Lieferung – umsatzsteuerfrei. Versand wird vor Zahlung angezeigt."
                      : "Preise inkl. MwSt. Versand wird vor Zahlung angezeigt."}
                  </div>

                  <div className="mt-4">
                    <Link href="/cart" className="text-sm underline text-neutral-600 hover:text-black">
                      Zurück zum Warenkorb
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}