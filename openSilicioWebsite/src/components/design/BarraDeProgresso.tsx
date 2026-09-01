import { Box } from '@mui/material'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * A barra de progresso do curso: uma régua de 4px, quadrada, sem raio.
 *
 * Anima só a largura do preenchimento, e uma vez por mudança de valor, então
 * não é uma daquelas animações que ficam repintando sozinhas.
 */
export default function BarraDeProgresso({
  concluidas,
  total,
  altura = 4,
  rotulo,
}: {
  concluidas: number
  total: number
  altura?: number
  rotulo?: string
}) {
  const reduce = useReducedMotion()
  const fracao = total > 0 ? Math.min(concluidas / total, 1) : 0

  return (
    <Box
      role="progressbar"
      aria-valuenow={concluidas}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={rotulo ?? `${concluidas} de ${total} aulas concluídas`}
      sx={{ height: altura, background: 'var(--color-line)', position: 'relative' }}
    >
      <motion.span
        initial={false}
        animate={{ width: `${fracao * 100}%` }}
        transition={{ duration: reduce ? 0 : 0.35, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          right: 'auto',
          display: 'block',
          background: 'var(--color-accent)',
        }}
      />
    </Box>
  )
}
