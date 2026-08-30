import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Typography } from '@mui/material'
import BlueprintFrame from './BlueprintFrame'

const MAX_WIDTH = 320
const VIEWPORT_MARGIN = 16

interface WikiPopoverProps {
  open: boolean
  rect: DOMRect | null
  term: string
  definition: string
  isPending: boolean
}

/** Renders the hover popover produced by useWikiGlossary — mount one per page. */
export default function WikiPopover({ open, rect, term, definition, isPending }: WikiPopoverProps) {
  const reduce = useReducedMotion()

  if (!rect) return null

  const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), window.innerWidth - MAX_WIDTH - VIEWPORT_MARGIN)
  const top = rect.bottom + 8

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ position: 'fixed', top, left, maxWidth: MAX_WIDTH, zIndex: 1400, pointerEvents: 'none' }}
        >
          <BlueprintFrame sx={{ p: 1.5, background: 'var(--color-bg)' }}>
            <span className="kicker">{isPending ? 'Verbete pendente' : term}</span>
            <Typography sx={{ fontSize: 14, lineHeight: '20px', color: 'var(--color-text-muted)' }}>
              {isPending ? `"${term}" ainda não tem uma entrada na wiki.` : definition}
            </Typography>
          </BlueprintFrame>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
