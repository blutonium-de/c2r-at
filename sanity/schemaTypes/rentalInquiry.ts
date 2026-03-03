import {defineType, defineField} from "sanity"

export const rentalInquiry = defineType({
  name: "rentalInquiry",
  title: "Anfrage (Miete)",
  type: "document",
  fields: [
    defineField({
      name: "rentalObject",
      title: "Miet-Objekt",
      type: "reference",
      to: [{type: "mietObjekt"}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
  name: "rentalObjectTitle",
  title: "Miet-Objekt (Name)",
  type: "string",
  readOnly: true,
}),

    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "email",
      title: "E-Mail",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),

    defineField({
      name: "phone",
      title: "Telefon",
      type: "string",
    }),

    defineField({
      name: "from",
      title: "Von",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "to",
      title: "Bis",
      type: "date",
      validation: (Rule) =>
        Rule.required().custom((to, ctx) => {
          const from = (ctx?.document as any)?.from
          if (!from || !to) return true
          return to >= from ? true : "Bis-Datum muss >= Von-Datum sein"
        }),
    }),

    defineField({
      name: "message",
      title: "Nachricht",
      type: "text",
    }),

    defineField({
      name: "consent",
      title: "Einwilligung",
      type: "boolean",
      initialValue: true,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          {title: "Neu", value: "new"},
          {title: "In Bearbeitung", value: "in_progress"},
          {title: "Erledigt", value: "done"},
        ],
        layout: "radio",
      },
      initialValue: "new",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "createdAt",
      title: "Erstellt am",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],

preview: {
  select: {
    name: "name",
    objTitle: "rentalObjectTitle",
    objRefName: "rentalObject.name",
    from: "from",
    to: "to",
    status: "status",
  },
  prepare({name, objTitle, objRefName, from, to, status}) {
    const range = from && to ? `${from} → ${to}` : ""
    const st =
      status === "new"
        ? "NEU"
        : status === "in_progress"
        ? "IN ARBEIT"
        : status === "done"
        ? "ERLEDIGT"
        : status

    return {
      title: objTitle || objRefName || "Anfrage",
      subtitle: [name, range, st].filter(Boolean).join(" · "),
    }
  },
},
})