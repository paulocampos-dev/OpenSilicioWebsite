import { Box, Button, Card, CardActionArea, CardContent, Chip, Divider, Grid, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useMemo, useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { educationApi } from '../services/api'
import type { EducationResource } from '../types'

type Level = 'Todos' | 'Iniciante' | 'Intermediário' | 'Avançado'
type Kind = 'Todos' | 'Projetos' | 'Guias' | 'Tutoriais'

export default function Educacao() {
  const [tab, setTab] = useState<Kind>('Todos')
  const [level, setLevel] = useState<Level>('Todos')
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [resources, setResources] = useState<EducationResource[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 6

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      const data = await educationApi.getAll(true) // Only published resources
      setResources(data)
    } catch (error) {
      console.error('Erro ao carregar recursos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesTab = tab === 'Todos' || r.category === tab
      const matchesLevel = level === 'Todos' // For now, we'll use category as level
      const matchesQuery = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      return matchesTab && matchesLevel && matchesQuery
    })
  }, [tab, level, query, resources])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <Stack spacing={6}>
      {/* Hero */}
      <Stack spacing={1} textAlign="center" alignItems="center">
        <Typography sx={{ typography: { xs: 'h4', sm: 'h3' } }} fontWeight={900}>Educação</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
          Explore nossos recursos educacionais para dominar eletrônica e projeto de circuitos integrados. Do iniciante ao avançado, há algo para você.
        </Typography>
      </Stack>

      {/* Tabs */}
      <Box>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1) }} variant="scrollable" scrollButtons allowScrollButtonsMobile>
          {(['Todos','Projetos','Guias','Tutoriais'] as Kind[]).map((k) => (
            <Tab key={k} value={k} label={k} />
          ))}
        </Tabs>
        <Divider sx={{ mt: 1 }} />
      </Box>

      {/* Search + Level filters */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <TextField
          placeholder="Buscar..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
          sx={{ width: { xs: '100%', md: 420 } }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(['Todos','Iniciante','Intermediário','Avançado'] as Level[]).map((lvl) => (
            <Chip
              key={lvl}
              label={lvl}
              color={level === lvl ? 'primary' : 'default'}
              variant={level === lvl ? 'filled' : 'outlined'}
              onClick={() => { setLevel(lvl); setPage(1) }}
            />
          ))}
        </Stack>
      </Stack>

      {/* Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Carregando recursos...</Typography>
            </Box>
          </Grid>
        ) : pageItems.length === 0 ? (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Nenhum recurso encontrado</Typography>
            </Box>
          </Grid>
        ) : (
          pageItems.map((r) => (
            <Grid key={r.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={`/educacao/${r.id}`}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="primary.main">{r.category}</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{r.description}</Typography>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                      <Button size="small">Ver recurso →</Button>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
        <Button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{'<'}</Button>
        {Array.from({ length: totalPages }).map((_, i) => {
          const n = i + 1
          const active = n === page
          return (
            <Button key={n} variant={active ? 'contained' : 'text'} onClick={() => setPage(n)} sx={{ minWidth: 36 }}>{n}</Button>
          )
        })}
        <Button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{'>'}</Button>
      </Stack>
    </Stack>
  )
}


