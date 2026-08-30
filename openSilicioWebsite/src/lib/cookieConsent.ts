// LGPD-style consent gate for the analytics cookie set up in analytics.ts.
// Stored choice lives in localStorage; the reopen event lets chrome outside
// the banner (the footer's "Cookies" link) bring it back for revision.

const STORAGE_KEY = 'opensilicio-cookie-consent'
const REOPEN_EVENT = 'opensilicio:reopen-cookie-consent'

export type ConsentChoice = 'accepted' | 'rejected'

export function getStoredConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'accepted' || value === 'rejected' ? value : null
  } catch {
    return null
  }
}

export function setStoredConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // localStorage unavailable (e.g. private browsing) — choice just won't persist across reloads
  }
}

export function reopenCookieConsent(): void {
  window.dispatchEvent(new Event(REOPEN_EVENT))
}

export function onReopenCookieConsent(handler: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, handler)
  return () => window.removeEventListener(REOPEN_EVENT, handler)
}
