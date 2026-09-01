import { useEffect, useState } from 'react'
import { Box, Container, Grid, Stack, Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { settingsApi } from '../services/api'
import type { SiteSettings } from '../types'
import { reopenCookieConsent } from '../lib/cookieConsent'

function InstagramGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="0" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
    </svg>
  )
}
function LinkedInGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="0" />
      <path d="M8 10v7M8 7v.5M12 17v-4a2 2 0 0 1 4 0v4" />
    </svg>
  )
}

const linkStyle = { color: 'var(--color-on-field-muted)', textDecoration: 'none', fontSize: '15px' }

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    settingsApi.getAll().then(setSettings).catch(() => {})
  }, [])

  const email = settings?.contact_email || 'opensilicio@gmail.com'
  const instagram = settings?.instagram_url || 'https://www.instagram.com/opensilicio/'
  const linkedin = settings?.linkedin_url || 'https://www.linkedin.com/company/opensilicio/'
  const address = settings?.address || 'Escola Politécnica da USP\nAv. Prof. Luciano Gualberto, trav. 3, 158\nSão Paulo — SP, 05508-010'

  return (
    <Box component="footer" className="field" sx={{ pt: 7, pb: 3 }}>
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <span className="nav-brand" style={{ marginRight: 0 }}>
                <img className="nav-brand__mark" src="/logo-mark-white.png" alt="" />
                <span className="nav-brand__name">OpenSilício</span>
              </span>
              <Typography sx={{ color: 'var(--color-on-field-muted)', fontSize: '15px', lineHeight: '24px', maxWidth: '34ch' }}>
                Democratizando o design de chips através de educação aberta e colaboração.
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack spacing={1.5}>
              <span className="kicker" style={{ color: 'var(--color-steel-300)' }}>Recursos</span>
              <Link component={RouterLink} to="/educacao" sx={linkStyle}>Educação</Link>
              <Link component={RouterLink} to="/cursos" sx={linkStyle}>Cursos</Link>
              <Link component={RouterLink} to="/blog" sx={linkStyle}>Blog</Link>
              <Link component={RouterLink} to="/wiki" sx={linkStyle}>Wiki</Link>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack spacing={1.5}>
              <span className="kicker" style={{ color: 'var(--color-steel-300)' }}>Sobre</span>
              <Link component={RouterLink} to="/sobre" sx={linkStyle}>Nossa História</Link>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1.5}>
              <span className="kicker" style={{ color: 'var(--color-steel-300)' }}>Contato</span>
              <Link href={`mailto:${email}`} sx={linkStyle}>{email}</Link>
              <Typography sx={{ color: 'var(--color-on-field-muted)', fontSize: '15px', lineHeight: '22px', whiteSpace: 'pre-line' }}>
                {address}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Link href={instagram} target="_blank" rel="noopener noreferrer" className="btn btn-icon" sx={{ border: '1px solid var(--color-line-on-field)', color: 'var(--color-on-field)' }} aria-label="Instagram">
                  <InstagramGlyph />
                </Link>
                <Link href={linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-icon" sx={{ border: '1px solid var(--color-line-on-field)', color: 'var(--color-on-field)' }} aria-label="LinkedIn">
                  <LinkedInGlyph />
                </Link>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Box className="caption-rule" sx={{ mt: 5 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ pt: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ color: 'var(--color-on-field-muted)', fontSize: '13px' }}>
              © {new Date().getFullYear()} OpenSilício · Grupo de Pesquisa e Extensão — Poli USP
            </Typography>
            <Link component="button" type="button" onClick={reopenCookieConsent} sx={{ ...linkStyle, fontSize: '13px', cursor: 'pointer' }}>
              Cookies
            </Link>
          </Stack>
          <RouterLink
            to="/login"
            className="btn btn-secondary"
            style={{ fontSize: '13px', color: 'var(--color-on-field)', borderColor: 'var(--color-line-on-field)' }}
          >
            Admin
          </RouterLink>
        </Stack>
      </Container>
    </Box>
  )
}
