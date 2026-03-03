export const metadata = {
  title: "Datenschutz – c2r.at",
}

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Datenschutzerklärung
        </h1>

        <div className="mt-10 space-y-10 text-neutral-700 leading-relaxed text-sm md:text-base">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              1. Verantwortlicher
            </h2>
            <p>
              c2r.at – Dirk Adamiak<br />
              Bahnhofstraße 27<br />
              4650 Lambach, Oberösterreich<br />
              E-Mail: info@c2r.at<br />
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              2. Erhebung und Speicherung personenbezogener Daten
            </h2>
            <p>
              Beim Besuch unserer Website werden automatisch Informationen durch
              den Browser Ihres Endgeräts an unseren Server gesendet. Diese Daten
              werden temporär in einem sogenannten Logfile gespeichert:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-1">
              <li>IP-Adresse des anfragenden Rechners</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Name und URL der abgerufenen Datei</li>
              <li>Referrer-URL</li>
              <li>verwendeter Browser und ggf. Betriebssystem</li>
            </ul>
            <p className="mt-3">
              Die Verarbeitung erfolgt zur Gewährleistung eines reibungslosen
              Verbindungsaufbaus, der Systemsicherheit sowie zu administrativen
              Zwecken.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              3. Kontaktaufnahme
            </h2>
            <p>
              Wenn Sie per Formular oder E-Mail Kontakt mit uns aufnehmen,
              werden Ihre angegebenen Daten zwecks Bearbeitung der Anfrage und
              für Anschlussfragen gespeichert. Eine Weitergabe erfolgt nicht
              ohne Ihre Einwilligung.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              4. Cookies
            </h2>
            <p>
              Unsere Website verwendet Cookies. Cookies sind kleine Textdateien,
              die auf Ihrem Endgerät gespeichert werden und keinen Schaden
              verursachen.
            </p>
            <p className="mt-3">
              Einige Cookies bleiben gespeichert, bis Sie diese löschen. Sie
              ermöglichen es uns, Ihren Browser beim nächsten Besuch
              wiederzuerkennen.
            </p>
            <p className="mt-3">
              Sie können Ihren Browser so einrichten, dass Sie über das Setzen
              von Cookies informiert werden und dies nur im Einzelfall erlauben.
              Bei der Deaktivierung von Cookies kann die Funktionalität der
              Website eingeschränkt sein.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              5. Web-Analyse
            </h2>
            <p>
              Unsere Website kann Funktionen eines Webanalysedienstes (z. B.
              Google Analytics) verwenden. Dazu werden Cookies eingesetzt,
              die eine Analyse der Benutzung der Website ermöglichen.
            </p>
            <p className="mt-3">
              Sie können dies verhindern, indem Sie Ihren Browser so einrichten,
              dass keine Cookies gespeichert werden. Mit dem Anbieter wird ein
              entsprechender Vertrag zur Auftragsverarbeitung abgeschlossen.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              6. Einbindung von Diensten und Inhalten Dritter
            </h2>
            <p>
              Auf unserer Website können Inhalte Dritter eingebunden sein
              (z. B. YouTube, Google Maps, Google Fonts). Dies setzt voraus,
              dass diese Anbieter die IP-Adresse der Nutzer verarbeiten,
              da ohne diese keine Darstellung möglich ist.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              7. Datenweitergabe
            </h2>
            <p>
              Eine Übermittlung Ihrer personenbezogenen Daten an Dritte erfolgt
              nur, wenn:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-1">
              <li>Sie ausdrücklich eingewilligt haben</li>
              <li>dies zur Vertragsabwicklung erforderlich ist</li>
              <li>eine gesetzliche Verpflichtung besteht</li>
              <li>berechtigte Interessen vorliegen</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              8. Speicherdauer
            </h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie dies
              zur Erfüllung vertraglicher oder gesetzlicher Pflichten
              erforderlich ist oder ein berechtigtes Interesse besteht.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              9. Ihre Rechte
            </h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>Recht auf Auskunft</li>
              <li>Recht auf Berichtigung</li>
              <li>Recht auf Löschung („Recht auf Vergessenwerden“)</li>
              <li>Recht auf Einschränkung der Verarbeitung</li>
              <li>Recht auf Datenübertragbarkeit</li>
              <li>Recht auf Widerspruch</li>
              <li>Recht auf Beschwerde bei der Datenschutzbehörde</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              10. Sicherheit
            </h2>
            <p>
              Wir setzen technische und organisatorische Sicherheitsmaßnahmen
              ein, um Ihre Daten gegen Manipulation, Verlust oder unbefugten
              Zugriff zu schützen. Diese Maßnahmen werden laufend angepasst.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-3">
              11. Aktualität und Änderung
            </h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf
              anzupassen, um sie an aktuelle rechtliche Anforderungen oder
              Änderungen unserer Leistungen anzupassen.
            </p>
          </section>

          <div className="pt-6 text-neutral-400 text-xs">
            © 2025 c2r.at
          </div>

        </div>
      </div>
    </main>
  )
}