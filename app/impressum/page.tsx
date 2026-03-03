export const metadata = {
  title: "Impressum – c2r.at",
}

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Impressum</h1>

        <div className="mt-8 space-y-6 text-neutral-700 leading-relaxed">
          <div>
            <strong>Medieninhaber & Betreiber:</strong>
            <br />
            Blutonium Cars
            <br />
            Bahnhofstraße 27
            <br />
            4650 Lambach
            <br />
            Österreich
          </div>

          <div>
            <strong>Kontakt:</strong>
            <br />
            E-Mail: info@blutoniumcars.at
          </div>

          <div>
            <strong>Unternehmensgegenstand:</strong>
            <br />
            Vermietung von Fahrzeugen (Adventure Vans, Wohnmobile, Spezialfahrzeuge, Anhänger, Arbeitsbühnen)
            sowie Handel mit Fahrzeugteilen & Zubehör.
          </div>

          <div>
            <strong>Haftung für Inhalte:</strong>
            <br />
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Richtigkeit,
            Vollständigkeit und Aktualität der bereitgestellten Informationen.
          </div>

          <div>
            <strong>Haftung für Links:</strong>
            <br />
            Unsere Website enthält Links zu externen Websites Dritter. Auf deren Inhalte haben wir keinen Einfluss.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
          </div>
        </div>
      </div>
    </main>
  )
}