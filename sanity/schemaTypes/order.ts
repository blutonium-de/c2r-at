import {defineType, defineField} from "sanity"

export const order = defineType({
  name: "order",
  title: "Bestellung",
  type: "document",
  fields: [
    defineField({
      name: "orderNumber",
      title: "Bestellnummer",
      type: "string",
      description: "z.B. C2R-1700000000000",
    }),

    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          {title: "Neu", value: "new"},
          {title: "Bezahlt", value: "paid"},
          {title: "Versendet", value: "shipped"},
          {title: "Storniert", value: "canceled"},
          {title: "Refunded", value: "refunded"},
        ],
        layout: "radio",
      },
      initialValue: "new",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "provider",
      title: "Zahlungsanbieter",
      type: "string",
      options: {
        list: [
          {title: "Stripe", value: "stripe"},
          {title: "PayPal", value: "paypal"},
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "providerOrderId",
      title: "Provider Order ID",
      type: "string",
      description: "Stripe Checkout Session ID oder PayPal Order ID",
    }),

    defineField({
      name: "stripeSessionId",
      title: "Stripe Session ID",
      type: "string",
    }),

    defineField({
      name: "currency",
      title: "Währung",
      type: "string",
      initialValue: "EUR",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "subtotal",
      title: "Zwischensumme",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: "shippingCost",
      title: "Versandkosten",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: "tax",
      title: "MwSt",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
      description: "Enthaltene MwSt. (Preise sind brutto / inkl. MwSt.)",
    }),

    defineField({
      name: "amountTotal",
      title: "Gesamtbetrag",
      type: "number",
      description: "Gesamtbetrag in EUR (z.B. 199.90)",
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({name: "customerName", title: "Kunde – Name", type: "string"}),
    defineField({name: "customerEmail", title: "Kunde – E-Mail", type: "string"}),
    defineField({name: "customerPhone", title: "Kunde – Telefon", type: "string"}),

    defineField({name: "isBusiness", title: "Firma", type: "boolean", initialValue: false}),
    defineField({name: "companyName", title: "Firma – Name", type: "string"}),
    defineField({name: "vatId", title: "UID / VAT ID", type: "string"}),

    defineField({
      name: "shippingProfile",
      title: "Versandprofil (Referenz)",
      type: "reference",
      to: [{type: "shippingProfile"}],
    }),

    defineField({
      name: "shippingProfileName",
      title: "Versandprofil (Name Snapshot)",
      type: "string",
      description: "Snapshot, falls Versandprofil später geändert wird.",
    }),

    defineField({
      name: "items",
      title: "Artikel",
      type: "array",
      of: [
        {
          type: "object",
          name: "orderItem",
          fields: [
            defineField({name: "title", title: "Titel", type: "string", validation: (Rule) => Rule.required()}),
            defineField({name: "sku", title: "SKU", type: "string"}),
            defineField({name: "quantity", title: "Menge", type: "number", validation: (Rule) => Rule.required().min(1)}),
            defineField({name: "unitPrice", title: "Stückpreis", type: "number", validation: (Rule) => Rule.required().min(0)}),
            defineField({
              name: "product",
              title: "Produkt (optional)",
              type: "reference",
              to: [{type: "product"}],
            }),
            defineField({
              name: "deliveryTimeLabel",
              title: "Lieferzeit (Snapshot)",
              type: "string",
              description: "Snapshot vom Produkt (optional).",
            }),
          ],
          preview: {
            select: {t: "title", q: "quantity"},
            prepare({t, q}) {
              return {title: t, subtitle: q ? `x${q}` : ""}
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: "shippingAddress",
      title: "Lieferadresse",
      type: "object",
      fields: [
        defineField({name: "line1", title: "Straße + Hausnr.", type: "string"}),
        defineField({name: "line2", title: "Adresse 2", type: "string"}),
        defineField({name: "postalCode", title: "PLZ", type: "string"}),
        defineField({name: "city", title: "Ort", type: "string"}),
        defineField({name: "country", title: "Land", type: "string"}),
      ],
    }),

    defineField({
      name: "billingAddress",
      title: "Rechnungsadresse",
      type: "object",
      fields: [
        defineField({name: "line1", title: "Straße + Hausnr.", type: "string"}),
        defineField({name: "line2", title: "Adresse 2", type: "string"}),
        defineField({name: "postalCode", title: "PLZ", type: "string"}),
        defineField({name: "city", title: "Ort", type: "string"}),
        defineField({name: "country", title: "Land", type: "string"}),
      ],
    }),

    defineField({
      name: "deliveryNotes",
      title: "Lieferhinweise (optional)",
      type: "text",
      description: "z.B. Abstellgenehmigung / Hinweise.",
    }),

    defineField({
      name: "paidAt",
      title: "Bezahlt am",
      type: "datetime",
    }),

    defineField({
      name: "trackingNumber",
      title: "Trackingnummer",
      type: "string",
    }),

    defineField({
      name: "shippedAt",
      title: "Versendet am",
      type: "datetime",
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
      provider: "provider",
      status: "status",
      email: "customerEmail",
      total: "amountTotal",
      orderNumber: "orderNumber",
    },
    prepare({provider, status, email, total, orderNumber}) {
      const p = provider === "stripe" ? "Stripe" : provider === "paypal" ? "PayPal" : provider
      const st = status?.toUpperCase?.() ?? ""
      const sum = typeof total === "number" ? `${total} €` : ""
      return {
        title: orderNumber || email || "Bestellung",
        subtitle: [p, st, sum].filter(Boolean).join(" · "),
      }
    },
  },
})