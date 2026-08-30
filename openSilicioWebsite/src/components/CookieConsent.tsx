import { useEffect, useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import BlueprintFrame from './design/BlueprintFrame'
import { initGoogleAnalytics, disableGoogleAnalytics } from '../lib/analytics'
import { getStoredConsent, setStoredConsent, onReopenCookieConsent } from '../lib/cookieConsent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    if (stored === 'accepted') {
      initGoogleAnalytics()
    } else if (stored === null) {
      setVisible(true)
    }
    return onReopenCookieConsent(() => setVisible(true))
  }, [])

  if (!visible) {
    return null
  }

  const accept = () => {
    setStoredConsent('accepted')
    initGoogleAnalytics()
    setVisible(false)
  }

  const reject = () => {
    setStoredConsent('rejected')
    disableGoogleAnalytics()
    setVisible(false)
  }

  return (
    <Box
      className="field"
      role="region"
      aria-label="Preferências de cookies"
      sx={{
        position: 'fixed',
        left: { xs: 12, sm: 20 },
        right: { xs: 12, sm: 'auto' },
        bottom: { xs: 12, sm: 20 },
        width: { sm: 280 },
        maxWidth: 'calc(100vw - 24px)',
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      {/* .field supplies the dark fill; BlueprintFrame must stay a separate
          nested element so the ".field .blueprint" border/corner rules
          (descendant selectors, see patterns/blueprint.css) actually match. */}
      <BlueprintFrame sx={{ p: 2 }}>
        <span className="kicker">Cookies</span>
        <Typography sx={{ color: 'var(--color-on-field-muted)', fontSize: '13px', lineHeight: '20px', mt: 1, mb: 2 }}>
          Usamos cookies para métricas de uso do site. Nenhum dado é coletado até que você aceite.
        </Typography>
        <Stack direction="row" spacing={1}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={reject}>
            Recusar
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={accept}>
            Aceitar
          </button>
        </Stack>
      </BlueprintFrame>
    </Box>
  )
}
