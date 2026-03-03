import {defineType, defineField} from "sanity"

export const rentalInquiryLock = defineType({
  name: "rentalInquiryLock",
  title: "Rental Inquiry Lock",
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

export default rentalInquiryLock