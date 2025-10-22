import { useState } from 'react'
import {
  Stack,
  Button,
  Typography,
  Collapse,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Divider,
  useTheme,
} from '@mui/material'
import XIcon from '@mui/icons-material/X'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import InstagramIcon from '@mui/icons-material/Instagram'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

interface ShareAndCiteProps {
  title: string
  author?: string
  url: string
  imageUrl?: string
  publishedDate: string
}

export default function ShareAndCite({ title, author, url, imageUrl, publishedDate }: ShareAndCiteProps) {
  const theme = useTheme()
  const [showCitations, setShowCitations] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const fullUrl = `${window.location.origin}${url}`
  const displayAuthor = author || 'OpenSilício Team'
  const year = new Date(publishedDate).getFullYear()
  const formattedDate = new Date(publishedDate).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Generate citations
  const standardCitation = `${displayAuthor}. (${year}). ${title}. OpenSilício. Disponível em: ${fullUrl}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`

  const bibtexCitation = `@misc{opensilicio${year},
  author = {${displayAuthor}},
  title = {${title}},
  year = {${year}},
  note = {OpenSilício},
  howpublished = {\\url{${fullUrl}}},
  urldate = {${new Date().toISOString().split('T')[0]}}
}`

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer')
  }

  const handleXShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  const handleInstagramShare = async () => {
    // Check if we're on mobile and Web Share API is available
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: title,
          text: `${title}\n\nVia OpenSilício`,
          url: fullUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(fullUrl, 'Link copiado! Cole no Instagram.')
        }
      }
    } else {
      // Desktop: just copy the link
      copyToClipboard(fullUrl, 'Link copiado! Compartilhe no Instagram.')
    }
  }

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSnackbar({ open: true, message: successMessage, severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao copiar para área de transferência', severity: 'error' })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <>
      <Stack spacing={3} sx={{ mt: 6 }}>
        <Divider />

        {/* Share Section */}
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            Compartilhar
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<LinkedInIcon />}
              onClick={handleLinkedInShare}
              sx={{
                borderColor: '#0A66C2',
                color: '#0A66C2',
                '&:hover': {
                  borderColor: '#0A66C2',
                  backgroundColor: 'rgba(10, 102, 194, 0.04)',
                },
              }}
            >
              LinkedIn
            </Button>
            <Button
              variant="outlined"
              startIcon={<XIcon />}
              onClick={handleXShare}
              sx={{
                borderColor: '#000000',
                color: '#000000',
                '&:hover': {
                  borderColor: '#000000',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              X
            </Button>
            <Button
              variant="outlined"
              startIcon={<InstagramIcon />}
              onClick={handleInstagramShare}
              sx={{
                borderColor: '#E4405F',
                color: '#E4405F',
                '&:hover': {
                  borderColor: '#E4405F',
                  backgroundColor: 'rgba(228, 64, 95, 0.04)',
                },
              }}
            >
              Instagram
            </Button>
          </Stack>
        </Stack>

        {/* Citations Section */}
        <Stack spacing={2} alignItems="center">
          <Button
            variant="text"
            startIcon={<FormatQuoteIcon />}
            endIcon={showCitations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowCitations(!showCitations)}
            sx={{ textTransform: 'none' }}
          >
            Citações
          </Button>

          <Collapse in={showCitations} sx={{ width: '100%' }}>
            <Stack spacing={3}>
              {/* Standard Citation */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      Citação Padrão (ABNT)
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(standardCitation, 'Citação copiada!')}
                      aria-label="Copiar citação padrão"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflowX: 'auto',
                    }}
                  >
                    {standardCitation}
                  </Box>
                </Stack>
              </Paper>

              {/* BibTeX Citation */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      BibTeX
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(bibtexCitation, 'BibTeX copiado!')}
                      aria-label="Copiar BibTeX"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                    }}
                  >
                    {bibtexCitation}
                  </Box>
                </Stack>
              </Paper>

              {/* Metadata */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50' }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Autor:</strong> {displayAuthor}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Título:</strong> {title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Publicado em:</strong> {formattedDate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>URL:</strong> {fullUrl}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Collapse>
        </Stack>
      </Stack>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
