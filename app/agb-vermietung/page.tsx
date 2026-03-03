export const metadata = {
  title: "AGB Vermietung – c2r.at",
}

export default function AGBVermietungPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">AGB – Vermietung</h1>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="font-semibold text-black mb-2">1. Geltungsbereich</h2>
            <p>
              Diese AGB gelten für die Vermietung von Wohnwagen, Camper Vans, Fahrzeugen,
              Anhängern und Arbeitsbühnen (nachfolgend „Mietsache“) durch c2r.at / Blutonium Cars.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">2. Voraussetzungen</h2>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Mindestalter des Mieters: <strong>21 Jahre</strong></li>
              <li>Gültiger amtlicher Lichtbildausweis</li>
              <li>Gültige Fahrerlaubnis (je nach Mietsache)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">3. Kaution</h2>
            <p>
              Für jede Vermietung ist eine <strong>Kaution</strong> zu hinterlegen. Die Höhe richtet sich nach der Mietsache
              und wird vor Übergabe bekanntgegeben. Die Kaution dient zur Absicherung von Schäden, Mehrkilometern,
              Reinigungsaufwand, fehlendem Zubehör, Maut/Strafen sowie sonstigen Forderungen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">4. Selbstbehalt / Versicherung</h2>
            <p>
              Soweit eine Versicherung besteht, gilt ein <strong>Selbstbehalt</strong>. Der Mieter trägt den Selbstbehalt
              im Schadenfall sowie alle Schäden, die nicht vom Versicherungsschutz umfasst sind (z.B. grobe Fahrlässigkeit,
              unsachgemäße Nutzung, Überladung, falsche Ladungssicherung).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">5. Nutzung – Privatbereich</h2>
            <p>
              Die Nutzung erfolgt grundsätzlich im <strong>Privatbereich</strong>. Eine gewerbliche Nutzung ist nur nach
              schriftlicher Vereinbarung zulässig.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">6. Anhänger – Ladung & Sicherung</h2>
            <p>
              Der Mieter ist allein verantwortlich für die Auswahl, Verladung, Sicherung und Kontrolle der Ladung.
              <strong> Keine Haftung</strong> für Schäden an transportierten Gütern oder durch unsachgemäße Ladungssicherung.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">7. Arbeitsbühnen – Einsatz & Haftung</h2>
            <p>
              Arbeitsbühnen dürfen nur von geeigneten, eingewiesenen Personen verwendet werden.
              Der Einsatz erfolgt auf eigenes Risiko. <strong>Keine Haftung bei Unfällen</strong>, Bedienfehlern,
              unsachgemäßer Verwendung oder Missachtung von Sicherheitsvorschriften.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">8. Übergabe / Rückgabe</h2>
            <p>
              Die Mietsache ist in gereinigtem und ordnungsgemäßem Zustand zurückzugeben. Fehlendes Zubehör,
              Beschädigungen oder außergewöhnliche Verschmutzungen werden dem Mieter in Rechnung gestellt
              und können mit der Kaution verrechnet werden.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black mb-2">9. Haftungsausschluss</h2>
            <p>
              Für Schäden, die durch unsachgemäße Nutzung, Fehlbedienung, Missachtung von Vorschriften,
              Überladung oder ungesicherte Ladung entstehen, wird keine Haftung übernommen.
              Gesetzliche Haftungstatbestände bleiben unberührt.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}