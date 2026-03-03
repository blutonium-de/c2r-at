import {defineType, defineField} from "sanity"

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Website Einstellungen",
  type: "document",
  fields: [
    defineField({
      name: "homeFeaturedRentals",
      title: "Startseite – Highlights (3 Fahrzeuge)",
      type: "array",
      of: [{type: "reference", to: [{type: "mietObjekt"}]}],
      validation: (Rule) => Rule.required().min(3).max(3),
      description: "Bitte genau 3 Mietobjekte auswählen (Reihenfolge = Anzeige).",
    }),
  ],
  preview: {
    prepare() {
      return {title: "Website Einstellungen"}
    },
  },
})