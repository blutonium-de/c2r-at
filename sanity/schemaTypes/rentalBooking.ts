import {defineType, defineField} from 'sanity'

export const rentalBooking = defineType({
  name: 'rentalBooking',
  title: 'Miet-Buchung / Blocker',
  type: 'document',
  fields: [
    defineField({
      name: 'rentalObject',
      title: 'Miet-Objekt',
      type: 'reference',
      to: [{type: 'mietObjekt'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          {title: 'Buchung', value: 'booking'},
          {title: 'Blocker (z.B. Wartung / reserviert)', value: 'block'},
        ],
        layout: 'radio',
      },
      initialValue: 'booking',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Option', value: 'option'},
          {title: 'Bestätigt', value: 'confirmed'},
          {title: 'Storniert', value: 'cancelled'},
        ],
        layout: 'radio',
      },
      initialValue: 'confirmed',
      validation: (Rule) => Rule.required(),
      hidden: ({document}) => (document as any)?.type === 'block',
    }),

    defineField({
      name: 'blockReason',
      title: 'Block-Grund (optional)',
      type: 'string',
      options: {
        list: [
          {title: 'Wartung', value: 'maintenance'},
          {title: 'Reserviert', value: 'reserved'},
          {title: 'Privat', value: 'private'},
          {title: 'Sonstiges', value: 'other'},
        ],
      },
      hidden: ({document}) => (document as any)?.type !== 'block',
    }),

    defineField({
      name: 'startDate',
      title: 'Von (Datum)',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'endDate',
      title: 'Bis (Datum)',
      type: 'date',
      validation: (Rule) =>
        Rule.required().custom((endDate, ctx) => {
          const start = (ctx?.document as any)?.startDate
          if (!start || !endDate) return true
          return endDate >= start ? true : 'Bis-Datum muss >= Von-Datum sein'
        }),
    }),

    defineField({
      name: 'notes',
      title: 'Notizen (optional)',
      type: 'text',
    }),
  ],

  preview: {
    select: {
      objName: 'rentalObject.name',
      type: 'type',
      status: 'status',
      reason: 'blockReason',
      start: 'startDate',
      end: 'endDate',
    },
    prepare({objName, type, status, reason, start, end}) {
      const typeLabel = type === 'block' ? 'BLOCK' : 'BUCHUNG'
      const statusLabel =
        status === 'confirmed' ? 'bestätigt' : status === 'option' ? 'option' : 'storniert'
      const reasonLabel =
        reason === 'maintenance'
          ? 'Wartung'
          : reason === 'reserved'
          ? 'Reserviert'
          : reason === 'private'
          ? 'Privat'
          : reason === 'other'
          ? 'Sonstiges'
          : ''
      const range = start && end ? `${start} → ${end}` : start ? `${start}` : ''
      return {
        title: objName ? `${objName}` : 'Miet-Buchung / Blocker',
        subtitle: [
          typeLabel,
          type === 'block' ? reasonLabel : statusLabel,
          range,
        ].filter(Boolean).join(' · '),
      }
    },
  },
})