// sanity/deskStructure.ts (oder wo du deine structure baust)
import {CogIcon} from "@sanity/icons"

export const structure = (S: any) =>
  S.list()
    .title("Content")
    .items([
      // ... deine normalen Listen
      S.listItem()
        .title("Website Einstellungen")
        .icon(CogIcon)
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      // ...
    ])