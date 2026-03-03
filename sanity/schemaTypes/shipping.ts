import {defineType, defineField} from 'sanity'

export const shippingProfile = defineType({
  name: 'shippingProfile',
  title: 'Versandprofil',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      initialValue: true,
    }),

    defineField({
      name: 'freeShippingThreshold',
      title: 'Versandkostenfrei ab (€)',
      type: 'number',
      description: 'Wenn gesetzt: ab diesem Warenwert kostet Versand 0 € (pro Zone).',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'rates',
      title: 'Versandkosten (AT / EU)',
      type: 'array',
      validation: (Rule) => Rule.min(1),
      of: [
        {
          type: 'object',
          name: 'shippingRate',
          title: 'Versandrate',
          fields: [
            defineField({
              name: 'zone',
              title: 'Zone',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: [
                  {title: 'Österreich (AT)', value: 'AT'},
                  {title: 'EU (ohne AT)', value: 'EU'},
                ],
                layout: 'radio',
              },
            }),

            defineField({
              name: 'class',
              title: 'Versandklasse',
              type: 'string',
              validation: (Rule) => Rule.required(),
              options: {
                list: [
                  {title: 'Klein', value: 'small'},
                  {title: 'Mittel', value: 'medium'},
                  {title: 'Groß / Spedition', value: 'large'},
                ],
              },
            }),

            defineField({
              name: 'price',
              title: 'Preis (€)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: {zone: 'zone', cls: 'class', price: 'price'},
            prepare({zone, cls, price}) {
              const z = zone === 'AT' ? 'AT' : 'EU'
              return {title: `${z} / ${cls}`, subtitle: `${price ?? 0} €`}
            },
          },
        },
      ],
    }),
  ],

  preview: {
    select: {title: 'title', active: 'isActive'},
    prepare({title, active}) {
      return {title, subtitle: active ? 'aktiv' : 'inaktiv'}
    },
  },
})