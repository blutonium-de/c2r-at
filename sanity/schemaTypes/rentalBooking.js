import {defineType, defineField} from 'sanity'

export const rentalBooking = defineType({
  name: 'rentalBooking',
  title: 'Miet-Buchung',
  type: 'document',
  fields: [
    defineField({
      name: 'vehicle',
      title: 'Miet-Objekt',
      type: 'reference',
      to: [{type: 'mietObjekt'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          {title: 'Anfrage', value: 'inquiry'},
          {title: 'Reserviert', value: 'reserved'},
          {title: 'Bezahlt / Fix', value: 'confirmed'},
          {title: 'Storniert', value: 'cancelled'},
          {title: 'Blockiert (Werkstatt/Privat)', value: 'blocked'},
        ],
        layout: 'radio',
      },
      initialValue: 'inquiry',
    }),

    defineField({
      name: 'startDate',
      title: 'Start',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'endDate',
      title: 'Ende',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'customerName',
      title: 'Kunde (Name)',
      type: 'string',
      hidden: ({document}) => document?.status === 'blocked',
    }),

    defineField({
      name: 'customerEmail',
      title: 'Kunde (E-Mail)',
      type: 'string',
      hidden: ({document}) => document?.status === 'blocked',
    }),

    defineField({
      name: 'notes',
      title: 'Notizen',
      type: 'text',
    }),
  ],

  preview: {
    select: {
      vehicle: 'vehicle.name',
      status: 'status',
      start: 'startDate',
      end: 'endDate',
    },
    prepare({vehicle, status, start, end}) {
      const s = start ? new Date(start).toLocaleDateString() : '?'
      const e = end ? new Date(end).toLocaleDateString() : '?'
      return {
        title: `${vehicle ?? 'Miet-Objekt'} · ${s} → ${e}`,
        subtitle: status,
      }
    },
  },
})