import {defineType, defineField} from 'sanity'

export const shippingProfile = defineType({
  name: 'shippingProfile',
  title: 'Versandprofil (AT / EU)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'Nur AT oder EU – andere Länder werden nicht angeboten.',
      options: {
        list: [
          {title: 'Österreich (AT)', value: 'AT'},
          {title: 'Europäische Union (EU)', value: 'EU'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'shippingClass',
      title: 'Versandklasse',
      type: 'string',
      options: {
        list: [
          {title: 'Klein', value: 'small'},
          {title: 'Mittel', value: 'medium'},
          {title: 'Groß', value: 'large'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'price',
      title: 'Versandkosten (€)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: 'freeFrom',
      title: 'Versandkostenfrei ab (€) (optional)',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      region: 'region',
      shippingClass: 'shippingClass',
      price: 'price',
      freeFrom: 'freeFrom',
      isActive: 'isActive',
    },
    prepare({title, region, shippingClass, price, freeFrom, isActive}) {
      const regionLabel = region === 'AT' ? 'AT' : region === 'EU' ? 'EU' : region
      const classLabel =
        shippingClass === 'small'
          ? 'Klein'
          : shippingClass === 'medium'
          ? 'Mittel'
          : shippingClass === 'large'
          ? 'Groß'
          : shippingClass

      const parts: string[] = []
      if (regionLabel) parts.push(regionLabel)
      if (classLabel) parts.push(classLabel)
      if (typeof price === 'number') parts.push(`${price} €`)
      if (typeof freeFrom === 'number') parts.push(`frei ab ${freeFrom} €`)
      if (isActive === false) parts.push('INAKTIV')

      return {
        title: title ?? 'Versandprofil',
        subtitle: parts.join(' · '),
      }
    },
  },
})