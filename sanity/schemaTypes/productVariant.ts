import {defineType, defineField} from 'sanity'

export const productVariant = defineType({
  name: 'productVariant',
  title: 'Produkt-Variante',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Variante (Anzeige-Name)',
      type: 'string',
      description: 'z.B. "Schwarz / XL" oder "Vinyl / Mint".',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'sku',
      title: 'SKU (Variante)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'options',
      title: 'Optionen',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'variantOption',
          fields: [
            defineField({name: 'name', title: 'Option', type: 'string', validation: (Rule) => Rule.required()}), // z.B. "Farbe"
            defineField({name: 'value', title: 'Wert', type: 'string', validation: (Rule) => Rule.required()}), // z.B. "Schwarz"
          ],
          preview: {
            select: {name: 'name', value: 'value'},
            prepare({name, value}) {
              return {title: `${name}: ${value}`}
            },
          },
        },
      ],
      description: 'z.B. Farbe=Schwarz, Größe=XL',
    }),

    defineField({
      name: 'priceOverride',
      title: 'Preis (optional, überschreibt Produktpreis)',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),

    defineField({
      name: 'stock',
      title: 'Lagerbestand (Variante)',
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
    select: {title: 'title', sku: 'sku', stock: 'stock'},
    prepare({title, sku, stock}) {
      return {
        title,
        subtitle: `${sku}${typeof stock === 'number' ? ` · Bestand: ${stock}` : ''}`,
      }
    },
  },
})