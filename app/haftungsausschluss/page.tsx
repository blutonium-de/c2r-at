export const metadata = {
  title: "Haftungsausschluss – Einbau, Motorsport & CE – c2r.at",
}

export default function HaftungsausschlussPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Haftungsausschluss – Einbau, Motorsport & CE
        </h1>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-black">1. Allgemeines</h2>
            <p>
              Dieser Haftungsausschluss gilt ergänzend zu unseren AGB und betrifft insbesondere den Einbau und
              die Verwendung von Fahrzeugteilen, Zubehör, Elektronikkomponenten sowie Produkten für Motorsport-
              oder Showzwecke.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">2. Einbau nur durch Fachpersonal</h2>
            <p>
              Der Einbau sicherheitsrelevanter Teile (z.B. Lenkräder, Airbag-Komponenten, Gurtsysteme, Bremsen,
              Fahrwerk, Elektronik/Steuergeräte) darf ausschließlich durch{" "}
              <strong>autorisiertes Fachpersonal mit entsprechender Ausbildung und Berechtigung</strong> erfolgen.
              Der Käufer/Mieter ist verpflichtet, alle Herstellerangaben, Einbauanleitungen, Drehmomente,
              Sicherheitsvorschriften sowie gesetzlichen Bestimmungen einzuhalten.
            </p>
            <p className="mt-3">
              <strong>Wichtig:</strong> Bei Airbag-/SRS-Teilen und Lenkrädern mit Airbag ist der Einbau ausschließlich durch
              befugtes Fachpersonal zulässig. Bei unsachgemäßem Einbau besteht Lebensgefahr.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">3. Erlöschen von Gewährleistung/Garantie/Umtausch bei unsachgemäßem Einbau</h2>
            <p>
              Wird Ware geöffnet, verbaut, verändert oder beschädigt, kann eine Rücknahme/Umtausch ausgeschlossen sein.
              Bei Elektronik und sicherheitsrelevanten Teilen erlischt{" "}
              <strong>Gewährleistung, Garantie oder Umtauschanspruch</strong>, wenn der Einbau nicht nachweislich durch
              autorisiertes Fachpersonal erfolgt ist oder wenn die Ware nicht mehr im Originalzustand ist.
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              Hinweis: Gesetzliche Gewährleistungsrechte bleiben unberührt, soweit zwingend anwendbar. Ein Nachweis über
              fachgerechten Einbau kann im Einzelfall erforderlich sein (z.B. Werkstattrechnung).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">4. Motorsport / Show / Off-Road – keine Straßenzulassung</h2>
            <p>
              Produkte können ausschließlich für Motorsport-, Show- oder Off-Road-Zwecke bestimmt sein. In diesen Fällen
              besteht <strong>keine Straßenzulassung</strong> bzw. die Nutzung im öffentlichen Straßenverkehr ist nur zulässig,
              wenn eine entsprechende Zulassung/Eintragung/Prüfung (z.B. §-Eintragung) tatsächlich vorliegt.
            </p>
            <p className="mt-3">
              Der Käufer ist selbst verantwortlich für die Prüfung der Zulässigkeit, Eintragungsfähigkeit und Verwendung
              im Straßenverkehr sowie für die Einhaltung aller Vorschriften (StVO, KFG, ECE/CE/Typisierung usw.).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">5. CE / E-Kennzeichnung / Zulassungen</h2>
            <p>
              Sofern Produkte Kennzeichnungen wie CE, E-Kennzeichen, ABE, Teilegutachten oder ähnliche Nachweise erfordern,
              liegt die Verantwortung für die Verwendung, Montage, Abnahme und Eintragung beim Käufer. Wir übernehmen keine
              Haftung dafür, dass ein Produkt in einem konkreten Fahrzeug bzw. in einer konkreten Konfiguration zulässig ist.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">6. Haftungsausschluss für Folgeschäden</h2>
            <p>
              Für Schäden, Folgeschäden oder Vermögensschäden, die aus unsachgemäßem Einbau, falscher Verwendung,
              Veränderung, fehlender Eintragung, Nutzung im Motorsport/Off-Road oder Missachtung von Sicherheitsvorschriften
              resultieren, wird keine Haftung übernommen, soweit gesetzlich zulässig.
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              Unberührt bleiben Haftungsansprüche bei Vorsatz und grober Fahrlässigkeit sowie zwingende gesetzliche
              Haftungstatbestände (z.B. Produkthaftung, soweit anwendbar).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black">7. Kontakt / Rückfragen</h2>
            <p>
              Bei Unsicherheit zur Zulässigkeit, Einbauart oder Kompatibilität kontaktiere uns bitte vor dem Kauf.
              Wir helfen gern mit allgemeinen Informationen – eine rechtliche/technische Abnahme oder Eintragung kann
              dadurch nicht ersetzt werden.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}