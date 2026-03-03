export const metadata = {
  title: "Widerrufsbelehrung – c2r.at",
}

export default function WiderrufPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl font-semibold tracking-tight">
          Widerrufsbelehrung
        </h1>

        <div className="mt-8 space-y-6 text-neutral-700 leading-relaxed">

          <p>
            Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen
            diesen Vertrag zu widerrufen.
          </p>

          <p>
            Die Frist beträgt 14 Tage ab Erhalt der Ware.
          </p>

          <p>
            Zur Ausübung senden Sie bitte eine eindeutige Erklärung an:
            <br /><br />
            info@c2r.at
          </p>

          <h2 className="font-semibold text-black mt-10">
            Muster-Widerrufsformular
          </h2>

          <p>
            Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf folgender Waren:
          </p>

          <ul className="mt-4 space-y-2">
            <li>Bestellt am:</li>
            <li>Erhalten am:</li>
            <li>Name:</li>
            <li>Anschrift:</li>
            <li>Datum / Unterschrift:</li>
          </ul>

          <p className="mt-6">
            Hinweis: Sonderanfertigungen sind vom Widerruf ausgeschlossen.
          </p>

        </div>
      </div>
    </main>
  )
}