import { useCallback, useRef, useState } from 'react'
import type { WikiLink } from '../../types'

interface GlossaryState {
  open: boolean
  rect: DOMRect | null
  term: string
  definition: string
  isPending: boolean
}

const HIDE_DELAY_MS = 140

const initialState: GlossaryState = { open: false, rect: null, term: '', definition: '', isPending: false }

function findWikiAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null
  return target.closest<HTMLAnchorElement>('a[href^="/wiki/"]')
}

/**
 * Powers the wiki-term hover popover on a page's inline Lexical body links
 * (a.wiki-link / a.wiki-link-pending) and its "Termos usados aqui/citados"
 * .tag-outline chips — both share the /wiki/{slug} href scheme, so one
 * delegated listener on a wrapping container covers both surfaces with no
 * extra requests (definitions come from the wikiLinks the page already fetched).
 */
export default function useWikiGlossary(wikiLinks: WikiLink[]) {
  const [state, setState] = useState<GlossaryState>(initialState)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const showFor = useCallback(
    (anchor: HTMLAnchorElement) => {
      const match = anchor.getAttribute('href')?.match(/^\/wiki\/(.+)$/)
      if (!match) return
      const slug = match[1]
      const anchorText = anchor.textContent || ''
      clearHideTimer()

      if (slug?.startsWith('pending-')) {
        setState({ open: true, rect: anchor.getBoundingClientRect(), term: anchorText, definition: '', isPending: true })
        return
      }

      const link = wikiLinks.find((l) => l.slug === slug)
      if (link?.definition) {
        setState({ open: true, rect: anchor.getBoundingClientRect(), term: link.term || anchorText, definition: link.definition, isPending: false })
      } else {
        // Stale/deleted entry or missing definition — fall back to the
        // same "not created yet" rendering rather than a broken/empty popover.
        setState({ open: true, rect: anchor.getBoundingClientRect(), term: anchorText, definition: '', isPending: true })
      }
    },
    [wikiLinks]
  )

  const hide = useCallback(() => {
    clearHideTimer()
    hideTimer.current = setTimeout(() => setState((s) => ({ ...s, open: false })), HIDE_DELAY_MS)
  }, [])

  const onMouseOver = useCallback(
    (e: React.MouseEvent) => {
      const anchor = findWikiAnchor(e.target)
      if (anchor) showFor(anchor)
    },
    [showFor]
  )

  const onMouseOut = useCallback(
    (e: React.MouseEvent) => {
      if (findWikiAnchor(e.target)) hide()
    },
    [hide]
  )

  const onFocus = useCallback(
    (e: React.FocusEvent) => {
      const anchor = findWikiAnchor(e.target)
      if (anchor) showFor(anchor)
    },
    [showFor]
  )

  const onBlur = useCallback(
    (e: React.FocusEvent) => {
      if (findWikiAnchor(e.target)) hide()
    },
    [hide]
  )

  return {
    popoverProps: state,
    containerHandlers: { onMouseOver, onMouseOut, onFocus, onBlur },
  }
}
