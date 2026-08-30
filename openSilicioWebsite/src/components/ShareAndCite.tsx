import { useState } from 'react'
import { Box, Collapse, Grid, Snackbar, Alert, Typography } from '@mui/material'
import BlueprintFrame from './design/BlueprintFrame'

interface ShareAndCiteProps {
  title: string
  author?: string
  url: string
  imageUrl?: string
  publishedDate: string
}

function LinkedInGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="0" />
      <path d="M8 10v7M8 7v.5M12 17v-4a2 2 0 0 1 4 0v4" />
    </svg>
  )
}
function XGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  )
}
function InstagramGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="0" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
    </svg>
  )
}

export default function ShareAndCite({ title, author, url, imageUrl, publishedDate }: ShareAndCiteProps) {
  const [showCitations, setShowCitations] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const fullUrl = `${window.location.origin}${url}`
  const displayAuthor = author || 'OpenSilício Team'
  const year = new Date(publishedDate).getFullYear()

  const standardCitation = `${displayAuthor}. (${year}). ${title}. OpenSilício. Disponível em: ${fullUrl}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`

  const bibtexCitation = `@misc{opensilicio${year},
  author = {${displayAuthor}},
  title  = {${title}},
  year   = {${year}},
  note   = {OpenSilício},
  howpublished = {\\url{${fullUrl}}},
  urldate = {${new Date().toISOString().split('T')[0]}}
}`

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSnackbar({ open: true, message: successMessage, severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: 'Erro ao copiar para área de transferência', severity: 'error' })
    }
  }

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, '_blank', 'noopener,noreferrer')
  }
  const handleXShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`, '_blank', 'noopener,noreferrer')
  }
  const handleInstagramShare = async () => {
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title, text: `${title}\n\nVia OpenSilício`, url: fullUrl })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') copyToClipboard(fullUrl, 'Link copiado! Cole no Instagram.')
      }
    } else {
      copyToClipboard(fullUrl, 'Link copiado! Compartilhe no Instagram.')
    }
  }

  void imageUrl // reserved for a future share-card preview; unused for now

  return (
    <>
      <BlueprintFrame sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
            px: 3, py: 2, borderBottom: '1px solid var(--color-line)',
          }}
        >
          <span className="kicker" style={{ margin: 0 }}>Compartilhar e citar</span>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" onClick={handleLinkedInShare}><LinkedInGlyph /> LinkedIn</button>
            <button type="button" className="btn btn-secondary" onClick={handleXShare}><XGlyph /> X</button>
            <button type="button" className="btn btn-secondary" onClick={handleInstagramShare}><InstagramGlyph /> Instagram</button>
            <button type="button" className="btn btn-secondary" onClick={() => copyToClipboard(fullUrl, 'Link copiado!')}>Copiar link</button>
            <button type="button" className="btn btn-primary" onClick={() => setShowCitations((v) => !v)}>Cite isso!</button>
          </Box>
        </Box>

        <Collapse in={showCitations}>
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ p: 3, borderRight: { sm: '1px solid var(--color-line)' } }}>
              <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', mb: 1 }}>Citação</Typography>
              <Box sx={{ p: 2, border: '1px solid var(--color-line)', fontSize: 15, lineHeight: '24px' }}>{standardCitation}</Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ p: 3 }}>
              <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', mb: 1 }}>BibTeX</Typography>
              <Box component="pre" sx={{ p: 2, border: '1px solid var(--color-line)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '22px', overflowX: 'auto', m: 0, whiteSpace: 'pre' }}>{bibtexCitation}</Box>
            </Grid>
          </Grid>
        </Collapse>
      </BlueprintFrame>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
