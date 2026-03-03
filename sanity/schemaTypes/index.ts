import {defineType, defineField} from "sanity"
import {mietObjekt} from "./mietObjekt"
import {productVariant} from "./productVariant"
import {shippingProfile} from "./shippingProfile"
import {rentalBooking} from "./rentalBooking"
import {rentalRate} from "./rentalRate"
import {rentalInquiry} from "./rentalInquiry"
import {rentalInquiryLock} from "./rentalInquiryLock"
import {rentalInquiryRate} from "./rentalInquiryRate"
import {siteSettings} from "./siteSettings"
import {order} from "./order"

export const schemaTypes = [
  // =========================
  // MIETE-KATEGORIE
  // =========================
  defineType({
    name: "rentalCategory",
    title: "Miete-Kategorie",
    type: "document",
    fields: [
      defineField({name: "title", title: "Titel", type: "string"}),
      defineField({name: "slug", title: "Slug", type: "slug", options: {source: "title"}}),
      defineField({name: "isActive", title: "Aktiv", type: "boolean", initialValue: true}),
    ],
  }),

  // =========================
  // MIET-OBJEKT / VARIANTEN / VERSAND / BUCHUNGEN / TARIFE / ANFRAGEN
  // =========================
  mietObjekt,
  productVariant,
  shippingProfile,
  rentalBooking,
  rentalRate,
  rentalInquiry,

  // ✅ Anti-Spam/Rate-Limit helper docs (für Anfrage-Blocker)
  rentalInquiryLock,
  rentalInquiryRate,

  // ✅ WEBSITE SETTINGS + ORDERS
  siteSettings,
  order,

  // =========================
  // SHOP-KATEGORIE
  // =========================
  defineType({
    name: "shopCategory",
    title: "Shop-Kategorie",
    type: "document",
    fields: [
      defineField({name: "title", title: "Titel", type: "string"}),
      defineField({name: "slug", title: "Slug", type: "slug", options: {source: "title"}}),
      defineField({name: "isActive", title: "Aktiv", type: "boolean", initialValue: true}),
    ],
  }),

  // =========================
  // PRODUKT
  // =========================
  defineType({
    name: "product",
    title: "Produkt",
    type: "document",
    fieldsets: [
      {name: "basis", title: "Basis"},
      {name: "preise", title: "Preise & Lager"},
      {name: "media", title: "Bilder & Beschreibung"},
    ],
    fields: [
      defineField({
        name: "title",
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
        options: {source: "title"},
        validation: (Rule) => Rule.required(),
      }),

      defineField({
        name: "sku",
        title: "Artikelnummer (SKU)",
        type: "string",
        fieldset: "basis",
        validation: (Rule) => Rule.required(),
      }),

      defineField({
        name: "category",
        title: "Kategorie",
        type: "reference",
        fieldset: "basis",
        to: [{type: "shopCategory"}],
      }),

      defineField({
        name: "condition",
        title: "Zustand",
        type: "string",
        fieldset: "basis",
        options: {
          list: [
            {title: "Neu", value: "neu"},
            {title: "Gebraucht", value: "gebraucht"},
          ],
          layout: "radio",
        },
      }),

      // ✅ Lieferzeit (optional)
      defineField({
        name: "deliveryTimeLabel",
        title: "Lieferzeit Text (optional)",
        type: "string",
        fieldset: "basis",
        description: 'z.B. "2–3 Werktage", "10–14 Tage", "1–2 Monate (China Lager)".',
      }),

      // ✅ Versand Hinweis (optional)
      defineField({
        name: "shippingNote",
        title: "Versand Hinweis (optional)",
        type: "string",
        fieldset: "basis",
        description: 'z.B. "Versand aus China Lager", "Abholung möglich", etc.',
      }),

      defineField({
        name: "price",
        title: "Preis (€)",
        type: "number",
        fieldset: "preise",
        validation: (Rule) => Rule.required().min(0),
      }),

      defineField({
        name: "stock",
        title: "Lagerbestand",
        type: "number",
        fieldset: "preise",
        description: "Nur für Produkte ohne Varianten. Bei Varianten bitte den Bestand in den Varianten pflegen.",
        validation: (Rule) => Rule.min(0),
      }),

      defineField({
        name: "variants",
        title: "Varianten",
        type: "array",
        fieldset: "preise",
        of: [{type: "productVariant"}],
        description: "z.B. Größe/Farbe. Wenn du keine Varianten brauchst: leer lassen.",
      }),

      defineField({
        name: "shippingProfiles",
        title: "Versandprofile (AT / EU)",
        type: "array",
        fieldset: "preise",
        of: [{type: "reference", to: [{type: "shippingProfile"}]}],
        description: "Wähle die Versandprofile, die für dieses Produkt erlaubt sind. Leer = kein Versand.",
      }),

      defineField({
        name: "images",
        title: "Produktbilder",
        type: "array",
        fieldset: "media",
        of: [{type: "image", options: {hotspot: true}}],
        validation: (Rule) => Rule.min(1),
      }),

      defineField({
        name: "description",
        title: "Beschreibung",
        type: "text",
        fieldset: "media",
      }),

      defineField({
        name: "isActive",
        title: "Aktiv",
        type: "boolean",
        initialValue: true,
      }),
    ],

    preview: {
      select: {title: "title", media: "images.0", price: "price", deliveryTimeLabel: "deliveryTimeLabel"},
      prepare({title, media, price, deliveryTimeLabel}) {
        const p = price ? `${price} €` : ""
        const d = deliveryTimeLabel ? ` · ${deliveryTimeLabel}` : ""
        return {title, subtitle: `${p}${d}`, media}
      },
    },
  }),

  // =========================
  // SEITE
  // =========================
  defineType({
    name: "page",
    title: "Seite",
    type: "document",
    fields: [
      defineField({name: "title", title: "Titel", type: "string"}),
      defineField({name: "slug", title: "Slug", type: "slug", options: {source: "title"}}),
      defineField({name: "content", title: "Inhalt", type: "array", of: [{type: "block"}]}),
      defineField({name: "isActive", title: "Aktiv", type: "boolean", initialValue: true}),
    ],
  }),
]