import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { useMediaQuery, useTheme } from '@mui/material'

type RevealOnLoadProps = PropsWithChildren<HTMLMotionProps<'div'>>

/**
 * Fades + rises content in once, meant for the loading -> loaded transition
 * (wrap only the "loaded" branch so it fires on mount, not on every re-render).
 */
export default function RevealOnLoad({ children, ...rest }: RevealOnLoadProps) {
  const reduce = useReducedMotion()
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('md'))
  const immediate = mobile || reduce

  return (
    <motion.div
      initial={immediate ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      {...(!immediate ? { transition: { duration: 0.22, ease: 'easeOut' as const } } : {})}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
