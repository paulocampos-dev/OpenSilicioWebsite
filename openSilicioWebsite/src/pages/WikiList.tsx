import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Grid, Stack, Typography } from '@mui/material'
import { wikiApi } from '../services/api'
import type { WikiEntry, PendingWikiLinkGrouped } from '../types'
import BlankSheet from '../components/design/BlankSheet'
import CardGridSkeleton from '../components/design/CardGridSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'

export default function WikiList() {
  const [entries, setEntries] = useState<WikiEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingGrouped, setPendingGrouped] = useState<PendingWikiLinkGrouped[]>([])

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const response = await wikiApi.getAll(true, 1, 100)
      setEntries(response.data)
      if (response.data.length === 0) {
        wikiApi.getPendingGrouped().then(setPendingGrouped).catch(() => {})
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar entradas da wiki:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return entry.term.toLowerCase().includes(query) || entry.definition.toLowerCase().includes(query)
  })

  return (
    <Stack spacing={4}>
      <Stack spacing={1.5}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: { xs: '34px', md: '44px' }, lineHeight: { xs: '36px', md: '46px' }, letterSpacing: '.01em', textTransform: 'uppercase', marginLeft: 'var(--optical-left)' }}>
          Wiki do OpenSilício
        </Typography>
        <Typography sx={{ fontSize: '16px', lineHeight: '24px', maxWidth: '60ch', color: 'var(--color-text-muted)' }}>
          Dicionário de termos técnicos e conceitos relacionados à eletrônica e projeto de circuitos integrados.
        </Typography>
      </Stack>

      {!loading && entries.length > 0 && (
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <input
            className="input"
            type="search"
            placeholder="Buscar um termo"
            aria-label="Buscar termo"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: 480 }}
          />
          <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            {entries.length} termos · A–Z
          </Typography>
        </Stack>
      )}

      {loading ? (
        <CardGridSkeleton count={6} columns={{ xs: 12, sm: 6 }} withPhoto={false} spacing={3} />
      ) : entries.length === 0 ? (
        <BlankSheet
          title="A wiki começa agora"
          body="Nenhuma entrada publicada ainda. Enquanto isso, os termos aparecem ligados dentro dos textos do blog e da educação — cada link é um pedido de verbete."
          tags={pendingGrouped.map((p) => `${p.term} · ${p.count}`)}
          ctas={[
            { label: 'Ver a Educação', to: '/educacao' },
            { label: 'Ler o Blog', to: '/blog', variant: 'secondary' },
          ]}
        />
      ) : filteredEntries.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 4 }}>Nenhuma entrada encontrada para sua busca.</Typography>
      ) : (
        <RevealOnLoad>
          <Grid container spacing={3}>
            {filteredEntries.map((entry) => (
              <Grid key={entry.id} size={{ xs: 12, sm: 6 }}>
                <RouterLink to={`/wiki/${entry.slug}`} className="card blueprint" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '24px', lineHeight: '26px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                    {entry.term}
                  </Typography>
                  <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>{entry.definition}</Typography>
                  {entry.aliases && entry.aliases.length > 0 && (
                    <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-accent-ink)' }}>
                      Também: {entry.aliases.join(', ')}
                    </Typography>
                  )}
                </RouterLink>
              </Grid>
            ))}
          </Grid>
        </RevealOnLoad>
      )}
    </Stack>
  )
}
