export const metadata = {
  title: "AGB – c2r.at",
}

export default function AGBPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Allgemeine Geschäftsbedingungen (AGB) – Verkauf
        </h1>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed text-sm md:text-base">

          <section>
            <h2 className="font-semibold text-black mb-2">1. Geltungsbereich</h2>
            <p>
              Diese AGB gelten für alle Bestellungen über den Online-Shop c2r.at.
              Vertragspartner ist:
              <br /><br />
              c2r.at – Dirk Adamiak<br />
              Bahnhofstraße 27<br />
              4650 Lambach, Österreich<br />
              info@c2r.at
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">2. Vertragsabschluss</h2>
            <p>
              Die Darstellung der Produkte stellt kein rechtlich bindendes Angebot dar.
              Mit Absenden der Bestellung geben Sie ein verbindliches Angebot ab.
              Der Vertrag kommt durch unsere Bestätigung oder Versand zustande.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">3. Preise</h2>
            <p>
              Alle Preise verstehen sich in Euro (€) inklusive gesetzlicher Mehrwertsteuer.
              Versandkosten werden gesondert ausgewiesen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">4. Eigentumsvorbehalt</h2>
            <p>
              Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">5. Sonderanfertigungen & China-Ware</h2>
            <p>
              Produkte, die als Sonderanfertigung oder mit Herkunftsland China gekennzeichnet sind,
              sind vom Umtausch ausgeschlossen.
            </p>
            <p className="mt-3">
              Eine Rücknahme erfolgt ausschließlich bei:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>ungeöffneter Originalverpackung</li>
              <li>nicht verbauter Ware</li>
              <li>unbeschädigtem Zustand</li>
            </ul>
            <p className="mt-3">
              Bereits ausgepackte, verbaute oder genutzte Ware ist vom Umtausch ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">6. Einbau & Fachbetrieb</h2>
            <p>
              Sicherheitsrelevante Teile (z.B. Lenkräder mit Airbag, Elektronik, Steuergeräte)
              dürfen ausschließlich durch autorisierte Fachbetriebe eingebaut werden.
            </p>
            <p className="mt-3">
              Erfolgt der Einbau nicht fachgerecht, erlischt jeglicher Gewährleistungs- und Garantieanspruch.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">7. Motorsport / Offroad</h2>
            <p>
              Bestimmte Produkte sind ausschließlich für Motorsport- oder Offroadzwecke bestimmt.
              Der Kunde ist selbst für Zulassung und Eintragung verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">8. Gewährleistung</h2>
            <p>
              Es gelten die gesetzlichen Bestimmungen nach österreichischem Recht.
              Keine Haftung bei unsachgemäßem Einbau oder Zweckentfremdung.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}