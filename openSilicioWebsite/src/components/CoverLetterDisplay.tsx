import { Box, Typography } from '@mui/material'
import BlueprintFrame from './design/BlueprintFrame'

interface CoverLetterDisplayProps {
  text?: string
  /** 'quote' — the heavier pull-quote treatment used on blog posts.
   *  'callout' — the boxed "before you start" note used on Educação resources. */
  variant?: 'quote' | 'callout'
}

export default function CoverLetterDisplay({ text, variant = 'quote' }: CoverLetterDisplayProps) {
  if (!text?.trim()) return null

  if (variant === 'callout') {
    return (
      <BlueprintFrame sx={{ p: 3, borderLeft: '2px solid var(--color-accent)' }}>
        <span className="kicker">Antes de começar</span>
        <Typography sx={{ fontSize: '16px', lineHeight: '26px', maxWidth: '62ch', margin: 0 }}>{text}</Typography>
      </BlueprintFrame>
    )
  }

  return (
    <Box sx={{ pl: 2.5, borderLeft: '2px solid var(--color-accent)' }}>
      <Typography
        sx={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 'var(--font-heading-weight-light)',
          fontSize: '24px',
          lineHeight: '34px',
          maxWidth: '52ch',
          margin: 0,
        }}
      >
        {text}
      </Typography>
    </Box>
  )
}
