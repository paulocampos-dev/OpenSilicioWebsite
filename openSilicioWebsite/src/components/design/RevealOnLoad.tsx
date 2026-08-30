import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

type RevealOnLoadProps = PropsWithChildren<HTMLMotionProps<'div'>>

/**
 * Fades + rises content in once, meant for the loading -> loaded transition
 * (wrap only the "loaded" branch so it fires on mount, not on every re-render).
 */
export default function RevealOnLoad({ children, ...rest }: RevealOnLoadProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
