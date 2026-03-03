export const metadata = {
  title: "FAQ – c2r.at",
}

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          FAQ
        </h1>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed">
          <div>
            <strong>Wie läuft die Anfrage ab?</strong>
            <br />
            Über das Anfrageformular senden Sie uns Ihren gewünschten Zeitraum.
            Wir prüfen die Verfügbarkeit und melden uns mit einem Angebot.
          </div>

          <div>
            <strong>Wo erfolgt die Übergabe?</strong>
            <br />
            In 4650 Lambach (Oberösterreich) nach Terminvereinbarung.
          </div>

          <div>
            <strong>Ist eine Kaution erforderlich?</strong>
            <br />
            Ja, die Höhe der Kaution ist beim jeweiligen Mietobjekt angegeben.
          </div>

          <div>
            <strong>Sind Haustiere erlaubt?</strong>
            <br />
            Nach individueller Vereinbarung.
          </div>
        </div>
      </div>
    </main>
  )
}