import Image from "next/image"
import Link from "next/link"

export const metadata = {
  title: "Kontakt – c2r.at",
  description:
    "Kontakt, WhatsApp, Abholung/Übergabe und Infos zu Vermietung & Shop.",
}

const WHATSAPP_NUMBER_INTL = "436641790129" // +43 664 1790129 (ohne + und ohne Leerzeichen)
const WHATSAPP_PREFILL = encodeURIComponent(
  "Hallo! Ich habe eine Frage zu c2r.at (Vermietung/Shop)."
)

export default function KontaktPage() {
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${WHATSAPP_PREFILL}`

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-2xl">
            <div className="text-sm text-neutral-500">Kontakt</div>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
              Schreib uns – am schnellsten über WhatsApp
            </h1>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              Fragen zu <b>Vermietung</b> (Wohnwagen, Camper Vans, Fahrzeuge,
              Anhänger, Arbeitsbühnen) oder zu <b>Shop</b> (Teile & Zubehör)?
              Wir antworten normalerweise sehr schnell.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-black text-white text-sm hover:opacity-85 transition"
              >
                <span aria-hidden>💬</span> WhatsApp öffnen
              </a>

              <a
                href="mailto:info@c2r.at"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-neutral-300 text-sm hover:border-black transition"
              >
                <span aria-hidden>✉️</span> info@c2r.at
              </a>

              <Link
                href="/miete"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-neutral-300 text-sm hover:border-black transition"
              >
                Vermietung ansehen →
              </Link>
            </div>
          </div>

          {/* Logo / Hero */}
          <div className="w-full lg:w-[520px]">
            <div className="rounded-3xl border border-neutral-200 overflow-hidden bg-neutral-50">
              <div className="relative aspect-[16/10]">
                <Image
                  src="/brand/c2r-hero.jpg"
                  alt="c2r.at – Car to rent / Caravan to rent"
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
              <div className="p-5 text-sm text-neutral-600">
                c2r.at – Vermietung & Shop • Lambach (OÖ)
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500">WhatsApp</div>
            <div className="mt-1 text-lg font-semibold">Schnellster Weg</div>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Ideal für Verfügbarkeiten, Termine, Fragen zu Abholung/Übergabe,
              Kaution/Selbstbehalt und Produktfragen.
            </p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full bg-black text-white text-sm hover:opacity-85 transition"
            >
              💬 Jetzt schreiben
            </a>
          </div>

          <div className="rounded-3xl border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500">Standort</div>
            <div className="mt-1 text-lg font-semibold">Abholung / Übergabe</div>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Bahnhofstraße 27, 4650 Lambach (OÖ)
              <br />
              Abholung/Übergabe nach Terminvereinbarung.
            </p>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Bahnhofstra%C3%9Fe+27%2C+4650+Lambach"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full border border-neutral-300 text-sm hover:border-black transition"
            >
              📍 Route öffnen
            </a>
          </div>

          <div className="rounded-3xl border border-neutral-200 p-6">
            <div className="text-sm text-neutral-500">E-Mail</div>
            <div className="mt-1 text-lg font-semibold">Für Angebote & Belege</div>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Für schriftliche Angebote, Rechnungsfragen, Versandthemen oder wenn
              du Dateien mitschicken willst.
            </p>

            <a
              href="mailto:info@c2r.at"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-full border border-neutral-300 text-sm hover:border-black transition"
            >
              ✉️ Mail senden
            </a>
          </div>
        </div>

        {/* Mini FAQ */}
        <div className="mt-14 rounded-3xl border border-neutral-200 p-8">
          <h2 className="text-xl font-semibold tracking-tight">Kurz & wichtig</h2>

          <div className="mt-6 grid md:grid-cols-2 gap-8 text-sm text-neutral-700 leading-relaxed">
            <div>
              <div className="font-semibold text-black">Vermietung</div>
              <ul className="mt-2 space-y-2 list-disc pl-5">
                <li>Mindestalter: <b>21 Jahre</b></li>
                <li>Kaution: <b>ja</b> (je nach Objekt)</li>
                <li>Selbstbehalt: <b>ja</b> (je nach Versicherung/Objekt)</li>
                <li>
                  Arbeitsbühnen/Anhänger: Nutzung auf eigene Verantwortung,
                  Ladungssicherung/Bedienung obliegt dem Mieter.
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-black">Shop</div>
              <ul className="mt-2 space-y-2 list-disc pl-5">
                <li>Versand: AT & EU-weit</li>
                <li>Abholung nach Absprache möglich</li>
                <li>
                  Bei sicherheitsrelevanten Teilen: Einbau nur durch Fachpersonal
                  empfohlen/erforderlich (Details in AGB/Haftungsausschluss).
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/versand-zahlung"
                  className="underline text-neutral-700 hover:text-black"
                >
                  Versand & Zahlung
                </Link>
                <Link
                  href="/datenschutz"
                  className="underline text-neutral-700 hover:text-black"
                >
                  Datenschutz
                </Link>
                <Link
                  href="/impressum"
                  className="underline text-neutral-700 hover:text-black"
                >
                  Impressum
                </Link>
                <Link
                  href="/haftungsausschluss"
                  className="underline text-neutral-700 hover:text-black"
                >
                  Haftungsausschluss
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Floating WhatsApp Button */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-3 text-sm shadow-lg hover:opacity-90 transition"
          aria-label="WhatsApp öffnen"
        >
          💬 WhatsApp
        </a>
      </div>
    </main>
  )
}