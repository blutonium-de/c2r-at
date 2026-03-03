import {NextResponse} from "next/server"
import {writeClient} from "@/sanity/lib/writeClient"

type Body = {
  rentalObjectId?: string
  rentalObjectTitle?: string
  name: string
  email: string
  phone?: string
  from: string
  to: string
  message?: string
  consent: boolean
}

function isIsoDate(s: any) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

function isEmail(s: any) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function norm(s: any) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
}

function getClientIp(req: Request) {
  // Vercel/Proxies
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  return req.headers.get("x-real-ip") || "unknown"
}

// Simple, stable hash → lock id. (FNV-1a 32bit, no deps)
function fnv1a32(input: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return ("00000000" + h.toString(16)).slice(-8)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    // ✅ Mietobjekt ist OPTIONAL (allgemeine Anfrage möglich)
    const rentalObjectId = norm(body?.rentalObjectId) || ""
    const safeTitle = norm(body?.rentalObjectTitle)

    if (!norm(body?.name)) return NextResponse.json({error: "Name fehlt."}, {status: 400})
    if (!isEmail(body?.email)) return NextResponse.json({error: "E-Mail ungültig."}, {status: 400})
    if (!isIsoDate(body?.from) || !isIsoDate(body?.to)) return NextResponse.json({error: "Datum ungültig."}, {status: 400})
    if (body.to < body.from) return NextResponse.json({error: "Bis-Datum muss >= Von-Datum sein."}, {status: 400})
    if (body.consent !== true) return NextResponse.json({error: "Bitte Einwilligung bestätigen."}, {status: 400})

    if (!process.env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({error: "SANITY_API_WRITE_TOKEN fehlt in .env.local"}, {status: 500})
    }

    const ip = getClientIp(req)

    // ✅ Idempotency Window: 2 Minuten Bucket
    // Wenn jemand exakt dieselbe Anfrage innerhalb dieses Fensters schickt → wird abgefangen.
    const bucketMs = 2 * 60 * 1000
    const bucket = Math.floor(Date.now() / bucketMs)

    // ✅ Fingerprint
    // Mietobjekt optional → leere Strings sind ok.
    const fingerprint = [
      "v2",
      rentalObjectId,
      safeTitle,
      norm(body.name).toLowerCase(),
      norm(body.email).toLowerCase(),
      norm(body.phone),
      body.from,
      body.to,
      norm(body.message),
      String(bucket),
      ip,
    ].join("|")

    const lockId = `rentalInquiryLock.${fnv1a32(fingerprint)}`

    // ✅ Lock-Dokument: wird nur einmal erstellt (unique _id)
    try {
      await writeClient.createIfNotExists({
        _id: lockId,
        _type: "rentalInquiryLock",
        createdAt: new Date().toISOString(),
        ip,
      } as any)
    } catch (e: any) {
      return NextResponse.json({error: "Duplikat oder Sperre aktiv. Bitte kurz warten und erneut versuchen."}, {status: 429})
    }

    // ✅ Rate Limit zusätzlich: max 3 Anfragen pro IP pro 5 Minuten (soft)
    const rateBucketMs = 5 * 60 * 1000
    const rateBucket = Math.floor(Date.now() / rateBucketMs)
    const rateId = `rentalInquiryRate.${ip}.${rateBucket}.${Date.now()}`

    try {
      await writeClient.create({
        _id: rateId,
        _type: "rentalInquiryRate",
        createdAt: new Date().toISOString(),
        ip,
      } as any)
    } catch {
      // ignore
    }

    const doc: any = {
      _type: "rentalInquiry",
      rentalObjectTitle: safeTitle || undefined,
      name: norm(body.name),
      email: norm(body.email),
      phone: norm(body.phone) || undefined,
      from: body.from,
      to: body.to,
      message: norm(body.message) || undefined,
      consent: body.consent,
      status: "new",
      createdAt: new Date().toISOString(),
      meta: {
        ip,
        lockId,
      },
    }

    // ✅ Reference nur setzen, wenn ID vorhanden
    if (rentalObjectId) {
      doc.rentalObject = {_type: "reference", _ref: rentalObjectId}
    }

    const created = await writeClient.create(doc)

    // ✅ E-Mail senden (nur beim echten Create)
    const {getTransport} = await import("@/lib/mailer")
    const transport = getTransport()

    const mailTo = process.env.MAIL_TO
    const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER

    if (!mailTo || !mailFrom) {
      throw new Error("MAIL_TO/MAIL_FROM fehlt in .env.local")
    }

    const textLines = [
      `Neue Miet-Anfrage`,
      ``,
      safeTitle ? `Mietobjekt: ${safeTitle}` : `Mietobjekt: (keines ausgewählt)`,
      rentalObjectId ? `Mietobjekt-ID: ${rentalObjectId}` : `Mietobjekt-ID: (keine)`,
      `Anfrage-ID: ${created._id}`,
      `Lock: ${lockId}`,
      `IP: ${ip}`,
      ``,
      `Name: ${norm(body.name)}`,
      `E-Mail: ${norm(body.email)}`,
      body.phone ? `Telefon: ${norm(body.phone)}` : null,
      `Von: ${body.from}`,
      `Bis: ${body.to}`,
      ``,
      body.message ? `Nachricht:\n${norm(body.message)}` : null,
    ].filter(Boolean) as string[]

    await transport.sendMail({
      from: mailFrom,
      to: mailTo,
      replyTo: norm(body.email),
      subject: safeTitle
        ? `Neue Miet-Anfrage: ${safeTitle}`
        : `Neue Anfrage: ${norm(body.name)}`,
      text: textLines.join("\n"),
    })

    return NextResponse.json({ok: true, id: created._id})
  } catch (err: any) {
    return NextResponse.json(
      {error: "Serverfehler beim Speichern der Anfrage.", details: err?.message ?? String(err)},
      {status: 500}
    )
  }
}