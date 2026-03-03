export const metadata = {
  title: "Versand & Zahlung – c2r.at",
}

export default function VersandZahlungPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Versand & Zahlungsbedingungen</h1>

        <div className="mt-8 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black">1. Liefergebiet</h2>
            <p>Wir liefern nach Österreich (AT) sowie EU-weit.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">2. Versandkosten</h2>
            <p>
              Die Versandkosten werden im Checkout vor Abschluss der Bestellung angezeigt und sind abhängig von
              Produkt/Versandart/Region. Bei Mischkörben gilt die im Checkout ausgewählte Versandart.
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              Hinweis: Preise im Shop sind in Euro (€) und <strong>inkl. MwSt.</strong> angegeben, sofern nicht anders ausgewiesen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">3. Lieferzeiten</h2>
            <p>
              Lieferzeiten werden – sofern angegeben – auf der Produktseite (z.B. „2–3 Werktage“) ausgewiesen.
              Bei mehreren Artikeln richtet sich die Lieferzeit nach dem Artikel mit der längsten Lieferzeit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">4. Abholung</h2>
            <p>
              Eine Abholung kann – sofern angeboten – nach vorheriger Absprache erfolgen. Details werden per E-Mail abgestimmt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">5. Zahlungsarten</h2>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>PayPal</li>
              <li>Kreditkarte / Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">6. Rechnung</h2>
            <p>
              Eine Rechnung wird nach Zahlung bereitgestellt bzw. der Lieferung beigelegt (je nach Prozess).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">7. Transportschäden</h2>
            <p>
              Bitte prüfen Sie die Ware unmittelbar nach Erhalt. Offensichtliche Transportschäden bitte sofort
              beim Zusteller reklamieren und uns zeitnah informieren.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}