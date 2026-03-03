import {defineType, defineField} from "sanity"

export const rentalInquiryRate = defineType({
  name: "rentalInquiryRate",
  title: "Rental Inquiry Rate Log",
  type: "document",
  fields: [
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({name: "ip", title: "IP", type: "string", readOnly: true}),
  ],
})

export default rentalInquiryRate