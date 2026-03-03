import {defineType, defineField} from 'sanity'

export const rentalRate = defineType({
  name: 'rentalRate',
  title: 'Miet-Tarif',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'type',
      title: 'Typ',
      type: 'string',
      options: {
        list: [
          {title: 'Daily (Mo–Do)', value: 'daily'},
          {title: 'Weekend (Fr–Sa)', value: 'weekend'},
          {title: 'Paket (X Tage)', value: 'package'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'days',
      title: 'Tage',
      type: 'number',
      description: 'Nur bei Paket-Tarifen.',
      hidden: ({parent}) => (parent as any)?.type !== 'package',
      validation: (Rule) =>
        Rule.custom((days, ctx) => {
          const type = (ctx?.parent as any)?.type
          if (type !== 'package') return true
          if (typeof days !== 'number') return 'Bitte Tage angeben (z.B. 3 oder 7)'
          if (days < 1) return 'Tage muss >= 1 sein'
          return true
        }),
    }),

    defineField({
      name: 'price',
      title: 'Preis (€)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
  ],

  preview: {
    select: {title: 'title', type: 'type', days: 'days', price: 'price'},
    prepare({title, type, days, price}) {
      const typeLabel = type === 'daily' ? 'daily' : type === 'weekend' ? 'weekend' : 'package'
      const daysLabel = type === 'package' && typeof days === 'number' ? `${days} Tage` : ''
      const priceLabel = typeof price === 'number' ? `${price} €` : ''
      return {
        title: title ?? 'Miet-Tarif',
        subtitle: [typeLabel, daysLabel, priceLabel].filter(Boolean).join(' · '),
      }
    },
  },
})