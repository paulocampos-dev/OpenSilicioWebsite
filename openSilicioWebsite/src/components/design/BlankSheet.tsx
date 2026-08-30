import { Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import BlueprintFrame from './BlueprintFrame'

interface BlankSheetCta {
  label: string
  to: string
  variant?: 'primary' | 'secondary'
}

interface BlankSheetProps {
  kicker?: string
  title: string
  body: string
  tags?: string[]
  ctas?: BlankSheetCta[]
}

/**
 * The shared "nothing here yet" panel — a hatched blueprint frame, a
 * one-sentence reason, and up to two CTAs. Used by the empty Wiki listing,
 * the pending wiki-term page, and the 404 page (the mockup's own note:
 * "the same pattern serves the pending entry and the 404").
 */
export default function BlankSheet({ kicker = 'Folha em branco', title, body, tags, ctas }: BlankSheetProps) {
  return (
    <BlueprintFrame
      sx={{
        p: 3,
        background:
          'repeating-linear-gradient(45deg, transparent 0 12px, color-mix(in srgb, var(--color-text) 4%, transparent) 12px 13px)',
      }}
    >
      <Stack spacing={2}>
        <span className="kicker">{kicker}</span>
        <Typography
          component="h4"
          sx={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--font-heading-weight)',
            fontSize: '26px',
            lineHeight: '28px',
            letterSpacing: '.02em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>
          {body}
        </Typography>
        {tags && tags.length > 0 && (
          <Stack spacing={1}>
            <Typography
              component="span"
              sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
            >
              Mais pedidos
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {tags.map((tag) => (
                <span key={tag} className="tag tag-outline">{tag}</span>
              ))}
            </Stack>
          </Stack>
        )}
        {ctas && ctas.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {ctas.map((cta) => (
              <RouterLink
                key={cta.to}
                to={cta.to}
                className={`btn ${cta.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}
              >
                {cta.label}
              </RouterLink>
            ))}
          </Stack>
        )}
      </Stack>
    </BlueprintFrame>
  )
}
