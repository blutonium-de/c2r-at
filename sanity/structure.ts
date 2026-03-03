import type {StructureResolver} from "sanity/structure"
import {ComposeIcon, CalendarIcon, TagIcon, PackageIcon, DocumentIcon, CogIcon} from "@sanity/icons"

export const structure: StructureResolver = (S) =>
  S.list()
    .title("C2R Admin")
    .items([
      S.listItem().title("Mietkategorien").icon(TagIcon).child(S.documentTypeList("rentalCategory").title("Mietkategorien")),

      S.divider(),

      S.listItem().title("Miet-Objekte").icon(ComposeIcon).child(S.documentTypeList("mietObjekt").title("Miet-Objekte")),

      S.listItem().title("Buchungen / Blocker").icon(CalendarIcon).child(S.documentTypeList("rentalBooking").title("Buchungen / Blocker")),

      S.listItem().title("Anfragen (Miete)").icon(DocumentIcon).child(S.documentTypeList("rentalInquiry").title("Anfragen (Miete)")),

      S.divider(),

      // ✅ Website Einstellungen (Singleton)
      S.listItem().title("Website Einstellungen").icon(CogIcon).child(S.document().schemaType("siteSettings").documentId("siteSettings")),

      S.divider(),

      S.listItem().title("Shop-Kategorien").icon(TagIcon).child(S.documentTypeList("shopCategory").title("Shop-Kategorien")),

      S.listItem().title("Produkte").icon(PackageIcon).child(S.documentTypeList("product").title("Produkte")),

      // ✅ NEU: Bestellungen
      S.listItem().title("Bestellungen").icon(DocumentIcon).child(S.documentTypeList("order").title("Bestellungen")),

      S.listItem().title("Versandprofile (AT/EU)").icon(CogIcon).child(S.documentTypeList("shippingProfile").title("Versandprofile (AT/EU)")),

      S.divider(),

      S.listItem().title("Seiten (CMS)").icon(DocumentIcon).child(S.documentTypeList("page").title("Seiten (CMS)")),
    ])