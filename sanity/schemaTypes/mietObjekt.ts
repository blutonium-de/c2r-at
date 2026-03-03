import {defineType, defineField} from "sanity"

export const mietObjekt = defineType({
  name: "mietObjekt",
  title: "Miet-Objekt",
  type: "document",

  fieldsets: [
    {name: "basis", title: "Basis", options: {collapsible: true, collapsed: false}},
    {name: "preise", title: "Preise & Konditionen", options: {collapsible: true, collapsed: false}},
    {name: "saison", title: "Saisonpreise & Pauschalen", options: {collapsible: true, collapsed: false}},
    {name: "daten", title: "Fahrzeug-Daten", options: {collapsible: true, collapsed: true}},
    {name: "ausstattungSet", title: "Ausstattung", options: {collapsible: true, collapsed: false}},
    {name: "media", title: "Bilder & Text", options: {collapsible: true, collapsed: false}},
  ],

  fields: [
    // =========================
    // BASIS
    // =========================
    defineField({
  name: "sortOrder",
  title: "Sortierung (Mietseite)",
  type: "number",
  description: "Kleinere Zahl = weiter oben auf der Miet-Seite.",
}),
    
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      fieldset: "basis",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      fieldset: "basis",
      options: {source: "name", maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "kategorie",
      title: "Kategorie",
      type: "reference",
      fieldset: "basis",
      to: [{type: "rentalCategory"}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "aktiv",
      title: "Aktiv (anzeigen)",
      type: "boolean",
      fieldset: "basis",
      initialValue: true,
    }),

    defineField({
      name: "standort",
      title: "Standort",
      type: "string",
      fieldset: "basis",
      initialValue: "Lambach, Österreich",
    }),

    defineField({
      name: "inWartung",
      title: "In Wartung (nicht buchbar)",
      type: "boolean",
      fieldset: "basis",
      initialValue: false,
    }),

    defineField({
      name: "wartungVon",
      title: "Wartung von (optional)",
      type: "date",
      fieldset: "basis",
      hidden: ({document}) => !(document as any)?.inWartung,
    }),

    defineField({
      name: "wartungBis",
      title: "Wartung bis (optional)",
      type: "date",
      fieldset: "basis",
      hidden: ({document}) => !(document as any)?.inWartung,
      validation: (Rule) =>
        Rule.custom((wartungBis, ctx) => {
          const doc = ctx?.document as any
          if (!doc?.inWartung) return true
          if (!doc?.wartungVon || !wartungBis) return true
          return wartungBis >= doc.wartungVon ? true : "Wartung bis muss >= Wartung von sein"
        }),
    }),

    // =========================
    // PREISE (Preis-Modell)
    // =========================
    defineField({
      name: "pricingModel",
      title: "Preis-Modell",
      type: "string",
      fieldset: "preise",
      initialValue: "day",
      options: {
        list: [
          {title: "Preis pro Tag (z.B. Vans/Arbeitsbühnen)", value: "day"},
          {title: "Preis pro Nacht (Fix, ohne Saison)", value: "night"},
          {title: "Saisonpreise (Preis/Nacht nach Monaten)", value: "seasonal"},
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),

    // ✅ LEGACY-FELDER (nur zum “Unknown field” killen – NICHT verwenden)
    defineField({name: "preisModell", title: "Preis-Modell (alt)", type: "string", readOnly: true, hidden: true}),
    defineField({name: "preisModell1", title: "Preis-Modell (alt2)", type: "string", readOnly: true, hidden: true}),
    defineField({name: "pricingModell", title: "Preis-Modell (alt3)", type: "string", readOnly: true, hidden: true}),

    defineField({
      name: "preisProTag",
      title: "Preis pro Tag (€)",
      type: "number",
      fieldset: "preise",
      description: "Pflicht bei Preis-Modell 'Tag'.",
      hidden: ({document}) => (document as any)?.pricingModel !== "day",
      validation: (Rule) =>
        Rule.custom((v, ctx) => {
          const doc = ctx?.document as any
          if (doc?.pricingModel !== "day") return true
          return typeof v === "number" && v >= 0 ? true : "Preis pro Tag ist Pflicht (>= 0) für Preis-Modell 'Tag'."
        }),
    }),

    defineField({
      name: "preisProNacht",
      title: "Preis pro Nacht (€)",
      type: "number",
      fieldset: "preise",
      description: "Pflicht bei Preis-Modell 'Nacht'.",
      hidden: ({document}) => (document as any)?.pricingModel !== "night",
      validation: (Rule) =>
        Rule.custom((v, ctx) => {
          const doc = ctx?.document as any
          if (doc?.pricingModel !== "night") return true
          return typeof v === "number" && v >= 0 ? true : "Preis pro Nacht ist Pflicht (>= 0) für Preis-Modell 'Nacht'."
        }),
    }),

    defineField({
      name: "kaution",
      title: "Kaution (€)",
      type: "number",
      fieldset: "preise",
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: "mindestMietdauer",
      title: "Mindestmietdauer (Tage)",
      type: "number",
      fieldset: "preise",
      validation: (Rule) => Rule.min(1),
    }),

    // ✅ Specials & Tarife (3 Tage / 7 Tage etc.)
    defineField({
      name: "tarife",
      title: "Specials & Tarife",
      type: "array",
      fieldset: "preise",
      description: "Optional: Paketpreise, Weekend, Mo–Do etc.",
      of: [
        {
          type: "object",
          name: "tarif",
          fields: [
            defineField({name: "title", title: "Titel", type: "string"}),
            defineField({
              name: "type",
              title: "Typ",
              type: "string",
              options: {
                list: [
                  {title: "Mo–Do", value: "daily"},
                  {title: "Fr–Sa", value: "weekend"},
                  {title: "Paket (x Tage)", value: "package"},
                ],
                layout: "radio",
              },
            }),
            defineField({name: "days", title: "Tage (nur Paket)", type: "number", validation: (Rule) => Rule.min(1)}),
            defineField({name: "price", title: "Preis (€)", type: "number", validation: (Rule) => Rule.min(0)}),
          ],
          preview: {
            select: {t: "title", type: "type", d: "days", p: "price"},
            prepare({t, type, d, p}) {
              const label =
                type === "package" && d
                  ? `Paket (${d} Tage)`
                  : type === "weekend"
                    ? "Weekend"
                    : type === "daily"
                      ? "Mo–Do"
                      : ""
              return {title: t ?? "Tarif", subtitle: [label, typeof p === "number" ? `${p} €` : null].filter(Boolean).join(" · ")}
            },
          },
        },
      ],
    }),

    // =========================
    // SAISONPREISE (Wohnwagen)
    // =========================
    defineField({
      name: "saisonPreise",
      title: "Saisonpreise (Preis/Nacht)",
      type: "array",
      fieldset: "saison",
      description: "Pflicht nur bei Preis-Modell 'Saisonpreise'.",
      hidden: ({document}) => (document as any)?.pricingModel !== "seasonal",
      // ✅ WICHTIG: Validation auf Feld-Ebene (nicht pro Item) => keine “roten Items” mehr
      validation: (Rule) =>
        Rule.custom((v, ctx) => {
          const doc = ctx?.document as any
          if (doc?.pricingModel !== "seasonal") return true
          if (!Array.isArray(v) || v.length === 0) return "Saisonpreise sind Pflicht bei Preis-Modell 'Saisonpreise'."

          // Jede Saison muss sauber befüllt sein:
          for (let i = 0; i < v.length; i++) {
            const s: any = v[i]
            if (!s?.title) return `Saison #${i + 1}: Saison-Name fehlt`
            if (!Array.isArray(s?.months) || s.months.length === 0) return `Saison #${i + 1}: Monate fehlen`
            if (typeof s?.pricePerNight !== "number") return `Saison #${i + 1}: Preis/Nacht fehlt`
          }

          return true
        }),
      of: [
        {
          type: "object",
          name: "seasonRate",
          title: "Saison",
          fields: [
            defineField({name: "title", title: "Saison-Name", type: "string"}),
            defineField({
              name: "months",
              title: "Monate",
              type: "array",
              of: [{type: "string"}],
              options: {
                list: [
                  {title: "Jänner", value: "01"},
                  {title: "Februar", value: "02"},
                  {title: "März", value: "03"},
                  {title: "April", value: "04"},
                  {title: "Mai", value: "05"},
                  {title: "Juni", value: "06"},
                  {title: "Juli", value: "07"},
                  {title: "August", value: "08"},
                  {title: "September", value: "09"},
                  {title: "Oktober", value: "10"},
                  {title: "November", value: "11"},
                  {title: "Dezember", value: "12"},
                ],
                layout: "tags",
              },
            }),
            defineField({name: "pricePerNight", title: "Preis / Nacht (€)", type: "number"}),
          ],
          preview: {
            select: {title: "title", price: "pricePerNight", months: "months"},
            prepare({title, price, months}) {
              const m = Array.isArray(months) ? months.join(", ") : ""
              return {
                title: title ?? "Saison",
                subtitle: [m ? `Monate: ${m}` : null, typeof price === "number" ? `${price} € / Nacht` : null]
                  .filter(Boolean)
                  .join(" · "),
              }
            },
          },
        },
      ],
    }),

    defineField({
      name: "langzeitRabatte",
      title: "Langzeitmiete – Rabatte",
      type: "array",
      fieldset: "saison",
      of: [
        {
          type: "object",
          name: "longTermDiscount",
          fields: [
            defineField({name: "fromWeeks", title: "Ab (Wochen)", type: "number"}),
            defineField({name: "percent", title: "Rabatt (%)", type: "number", description: "z.B. 5 für -5%"}),
          ],
          preview: {
            select: {w: "fromWeeks", p: "percent"},
            prepare({w, p}) {
              return {title: `ab ${w ?? "?"} Woche(n)`, subtitle: typeof p === "number" ? `-${p}%` : ""}
            },
          },
        },
      ],
    }),

    defineField({name: "servicePauschale", title: "Servicepauschale (€) (einmalig)", type: "number", fieldset: "saison"}),
    defineField({name: "endReinigung", title: "Endreinigung (€) (einmalig)", type: "number", fieldset: "saison"}),

    defineField({
      name: "preiseHinweis",
      title: "Preis-Hinweis (optional)",
      type: "string",
      fieldset: "saison",
      initialValue: "Alle Preise inkl. 20% MwSt.",
    }),

    // =========================
    // DATEN
    // =========================
    defineField({name: "sitzplaetze", title: "Sitzplätze", type: "number", fieldset: "daten"}),
    defineField({name: "schlafplaetze", title: "Schlafplätze", type: "number", fieldset: "daten"}),
    defineField({
      name: "getriebe",
      title: "Getriebe",
      type: "string",
      fieldset: "daten",
      options: {list: [{title: "Automatik", value: "automatik"}, {title: "Manuell", value: "manuell"}], layout: "radio"},
    }),

    // =========================
    // AUSSTATTUNG
    // =========================
    defineField({
      name: "ausstattung",
      title: "Ausstattung",
      type: "array",
      fieldset: "ausstattungSet",
      of: [{type: "string"}],
      options: {
        list: [
          {title: "Klimaanlage", value: "klima"},
          {title: "WC / Bad", value: "bad"},
          {title: "Küche", value: "kueche"},
          {title: "Autarkie Paket", value: "autark"},
          {title: "12V & 230V", value: "12v230v"},
          {title: "Solar", value: "solar"},
          {title: "Markise", value: "markise"},
          {title: "AHK", value: "ahk"},
          {title: "Isofix", value: "isofix"},
        ],
        layout: "tags",
      },
    }),

    // =========================
    // MEDIA
    // =========================
    defineField({
      name: "bilder",
      title: "Bilder",
      type: "array",
      fieldset: "media",
      of: [{type: "image", options: {hotspot: true}}],
      validation: (Rule) => Rule.min(1),
    }),

    defineField({name: "beschreibung", title: "Beschreibung", type: "text", fieldset: "media"}),
  ],

  preview: {
    select: {
      title: "name",
      media: "bilder.0",
      model: "pricingModel",
      perDay: "preisProTag",
      perNight: "preisProNacht",
      saison: "saisonPreise",
      inWartung: "inWartung",
    },
    prepare({title, media, model, perDay, perNight, saison, inWartung}) {
      const wartungLabel = inWartung ? " · WARTUNG" : ""
      let subtitle = "Preis auf Anfrage"
      if (model === "day" && typeof perDay === "number") subtitle = `${perDay} € / Tag`
      if (model === "night" && typeof perNight === "number") subtitle = `${perNight} € / Nacht`
      if (model === "seasonal" && Array.isArray(saison) && saison.length) subtitle = `Saisonpreise (${saison.length})`

      return {title: (title ?? "Miet-Objekt") + wartungLabel, subtitle, media}
    },
  },
})