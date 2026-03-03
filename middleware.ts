import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"

export function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl

  // nur /studio schützen (und alles darunter)
  if (!pathname.startsWith("/studio")) return NextResponse.next()

  const user = process.env.STUDIO_USER
  const pass = process.env.STUDIO_PASS
  if (!user || !pass) return NextResponse.next() // wenn env fehlt, nicht blocken (dev friendly)

  const auth = req.headers.get("authorization")
  if (auth) {
    const [type, encoded] = auth.split(" ")
    if (type === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8")
      const [u, p] = decoded.split(":")
      if (u === user && p === pass) return NextResponse.next()
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Area"',
    },
  })
}

export const config = {
  matcher: ["/studio/:path*"],
}