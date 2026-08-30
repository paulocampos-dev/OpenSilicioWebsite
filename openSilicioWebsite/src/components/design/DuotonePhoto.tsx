import { useState } from 'react'
import { Box, type SxProps, type Theme } from '@mui/material'
import { motion, useReducedMotion } from 'framer-motion'

interface DuotonePhotoProps {
  src?: string
  alt?: string
  /** Shown instead of a photo when `src` is empty — this system never fakes one. */
  label: string
  /** 'category-watermark' is the large condensed-uppercase label used on
   * Educação cards with no thumbnail yet; 'default' is the plain caption
   * placeholder used everywhere else (hero, blog cards, resource covers). */
  variant?: 'default' | 'category-watermark'
  aspectRatio?: string
  sx?: SxProps<Theme>
  /** One-time diagonal light sweep across the photo once it loads. Reserve
   * this for hero/cover-sized single photos — never for a grid of thumbnails. */
  sweepOnLoad?: boolean
}

export default function DuotonePhoto({ src, alt = '', label, variant = 'default', aspectRatio = '16 / 9', sx, sweepOnLoad = false }: DuotonePhotoProps) {
  const reduce = useReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const [swept, setSwept] = useState(false)

  if (src) {
    return (
      <Box className="duotone" sx={{ aspectRatio, ...sx }}>
        <img src={src} alt={alt} onLoad={() => setLoaded(true)} />
        {sweepOnLoad && loaded && !reduce && !swept && (
          <motion.div
            aria-hidden
            initial={{ x: '-110%' }}
            animate={{ x: '130%' }}
            transition={{ duration: 0.95, ease: [0.3, 0.6, 0.2, 1] }}
            onAnimationComplete={() => setSwept(true)}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(100deg, transparent 20%, color-mix(in srgb, var(--color-steel-300) 55%, transparent) 50%, transparent 80%)',
            }}
          />
        )}
      </Box>
    )
  }

  if (variant === 'category-watermark') {
    return (
      <Box
        sx={{
          aspectRatio,
          display: 'grid',
          placeItems: 'center',
          background:
            'repeating-linear-gradient(45deg, transparent 0 10px, color-mix(in srgb, var(--color-text) 5%, transparent) 10px 11px)',
          ...sx,
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--font-heading-weight)',
            fontSize: '32px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-steel-600)',
          }}
        >
          {label}
        </Box>
      </Box>
    )
  }

  return (
    <Box className="photo-slot" sx={{ aspectRatio, ...sx }}>
      {label}
    </Box>
  )
}
