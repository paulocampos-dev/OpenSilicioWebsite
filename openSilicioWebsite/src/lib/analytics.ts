// Minimal GA4 loader for the public site. No-op when VITE_GA_MEASUREMENT_ID
// is unset (e.g. local dev), so we never send traffic from non-production
// builds. Page views are tracked manually on route change (see App.tsx)
// because gtag's automatic pageview only fires once for a client-side SPA.

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

let initialized = false
let enabled = false

export function initGoogleAnalytics(): void {
  if (!GA_MEASUREMENT_ID || typeof document === 'undefined') {
    return
  }
  enabled = true
  // Google's documented opt-out flag — also clears it if a prior reject() set it.
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = false

  if (initialized) {
    return
  }
  initialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  // We send page_view events manually via trackPageView, once per route change.
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
}

// Revokes a consent previously given via initGoogleAnalytics() in the same
// session — e.g. the user reopens the cookie panel and picks "Recusar"
// after having accepted. Stops our own page_view calls and sets the
// standard GA opt-out flag so any already-loaded gtag runtime stays quiet.
export function disableGoogleAnalytics(): void {
  enabled = false
  if (GA_MEASUREMENT_ID) {
    ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true
  }
}

export function trackPageView(path: string): void {
  if (!enabled || !window.gtag) {
    return
  }
  window.gtag('event', 'page_view', { page_path: path })
}
