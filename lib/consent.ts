// lib/consent.ts
export const CONSENT_KEY = "c2r_cookie_banner_ok_v1"

export function hasCookieBannerConsent(): boolean {
  if (typeof window === "undefined") return true // Server: nichts anzeigen
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "1"
  } catch {
    return true // falls Storage blockiert → Banner nicht nerven
  }
}

export function setCookieBannerConsent() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CONSENT_KEY, "1")
  } catch {
    // ignore
  }
}