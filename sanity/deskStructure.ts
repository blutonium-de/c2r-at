// sanity/deskStructure.ts
import {CogIcon} from "@sanity/icons"

export const structure = (S: any) =>
  S.list()
    .title("C2R Admin")
    .items([
      S.documentTypeListItem("rentalCategory").title("Mietkategorien"),
      S.documentTypeListItem("mietObjekt").title("Miet-Objekte"),
      S.documentTypeListItem("rentalBooking").title("Buchungen / Blocker"),
      S.documentTypeListItem("rentalInquiry").title("Anfragen (Miete)"),

      S.divider(),

      S.listItem()
        .title("Website Einstellungen")
        .icon(CogIcon)
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),

      S.divider(),

      S.documentTypeListItem("shopCategory").title("Shop-Kategorien"),
      S.documentTypeListItem("product").title("Produkte"),
      S.documentTypeListItem("usedVehicle").title("Gebrauchte Fahrzeuge"),
      S.documentTypeListItem("order").title("Bestellungen"),
      S.documentTypeListItem("shippingProfile").title("Versandprofile (AT/EU)"),

      S.divider(),

      S.documentTypeListItem("page").title("Seiten (CMS)"),
    ])