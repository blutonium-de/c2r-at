import "./globals.css"
import Link from "next/link"
import {CartProvider} from "@/lib/cart"
import MiniCart from "@/components/MiniCart"
import CookieBanner from "@/components/CookieBanner"

export const metadata = {
  title: "c2r.at – Vermietung & Autoparts (Blutonium Cars Edition)",
  description:
    "Adventure Vans, Luxus-Wohnwagen, Transporter & Spezialfahrzeuge mieten. Autoparts & Camper-Zubehör neu/gebraucht. Bahnhofstraße 27, 4650 Lambach (OÖ).",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

const nav = [
  {href: "/miete", label: "Miete"},
  {href: "/shop", label: "Shop"},
  {href: "/kontakt", label: "Kontakt"},
]

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="de">
      <body className="bg-white text-black">
        <CartProvider>
          <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 md:px-6 py-3">
              
              {/* ZEILE 1: Branding + Actions */}
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight whitespace-nowrap">c2r.at</span>
                  <span className="text-[11px] text-neutral-500 whitespace-nowrap truncate">
                    by Blutonium Cars
                  </span>
                </Link>

                <div className="flex items-center gap-3">
                  <MiniCart />

                  <Link
                    href="/anfrage"
                    className="inline-flex items-center rounded-full bg-black px-4 py-2 text-white text-sm hover:opacity-85 transition"
                  >
                    Anfrage
                  </Link>
                </div>
              </div>

              {/* ZEILE 2: Navigation */}
              <nav className="mt-3 overflow-x-auto">
                <div className="flex gap-5 text-sm min-w-max">
                  {nav.map((x) => (
                    <Link
                      key={x.href}
                      href={x.href}
                      className="text-neutral-700 hover:text-black transition whitespace-nowrap"
                    >
                      {x.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </header>

          {children}

          <footer className="border-t border-neutral-200">
            <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 md:grid-cols-3">
              <div>
                <div className="font-semibold">c2r.at</div>
                <div className="mt-2 text-sm text-neutral-600">Vermietung & Verkauf</div>
                <div className="mt-2 text-sm text-neutral-600">eine Edition von Blutonium Cars</div>
                <div className="mt-2 text-sm text-neutral-600">Bahnhofstraße 27, 4650 Lambach (OÖ)</div>
              </div>

              <div className="text-sm">
                <div className="font-medium">Rechtliches</div>
                <div className="mt-3 flex flex-col gap-2 text-neutral-600">
                  <Link href="/impressum" className="hover:text-black">
                    Impressum
                  </Link>
                  <Link href="/datenschutz" className="hover:text-black">
                    Datenschutz
                  </Link>
                  <Link href="/agb" className="hover:text-black">
                    AGB Verkauf
                  </Link>
                  <Link href="/widerruf" className="hover:text-black">
                    Widerruf
                  </Link>
                  <Link href="/versand-zahlung" className="hover:text-black">
                    Versand & Zahlung
                  </Link>
                  <Link href="/agb-vermietung" className="hover:text-black">
                    AGB Vermietung
                  </Link>
                  <Link href="/haftungsausschluss" className="hover:text-black">
                    Haftungsausschluss (Einbau/Motorsport/CE)
                  </Link>
                </div>
              </div>

              <div className="text-sm">
                <div className="font-medium">Kontakt</div>
                <div className="mt-3 text-neutral-600">
                  E-Mail: <span className="text-black">info@blutoniumcars.at</span>
                </div>
                <div className="mt-2 text-neutral-600">Abholung/Übergabe: Lambach (OÖ)</div>
              </div>
            </div>

            <div className="border-t border-neutral-200">
              <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-neutral-500">
                © {new Date().getFullYear()} c2r.at · Blutonium Cars Edition
              </div>
            </div>
          </footer>

          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  )
}