import { Box, Grid, Stack, Typography } from '@mui/material'
import { useMemo, useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { educationApi } from '../services/api'
import type { EducationResource } from '../types'
import DuotonePhoto from '../components/design/DuotonePhoto'
import CardGridSkeleton from '../components/design/CardGridSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'

const MotionGridItem = motion.create(Grid)

type Level = 'Todos' | 'Iniciante' | 'Intermediário' | 'Avançado'
type Kind = 'Todos' | 'Projetos' | 'Guias' | 'Tutoriais' | 'Teóricos'

const kinds: Kind[] = ['Todos', 'Projetos', 'Guias', 'Tutoriais', 'Teóricos']
const levels: Level[] = ['Todos', 'Iniciante', 'Intermediário', 'Avançado']

export default function Educacao() {
  const reduce = useReducedMotion()
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
      // Load all published resources with high limit for client-side filtering
      const response = await educationApi.getAll(true, 1, 100)
      setResources(response.data)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar recursos:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<Kind, number> = { Todos: resources.length, Projetos: 0, Guias: 0, Tutoriais: 0, Teóricos: 0 }
    for (const r of resources) {
      if (r.category in c) c[r.category as Kind] += 1
    }
    return c
  }, [resources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesTab = tab === 'Todos' || r.category === tab
      const matchesLevel = level === 'Todos' || r.difficulty === level
      const matchesQuery = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      return matchesTab && matchesLevel && matchesQuery
    })
  }, [tab, level, query, resources])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <Stack spacing={5}>
      <Stack spacing={1.5}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: { xs: '40px', md: '56px' }, lineHeight: { xs: '42px', md: '58px' }, letterSpacing: '.01em', textTransform: 'uppercase', marginLeft: 'var(--optical-left)' }}>
          Educação
        </Typography>
        <Typography sx={{ fontSize: '17px', lineHeight: '26px', maxWidth: '64ch', color: 'var(--color-text-muted)' }}>
          Explore nossos recursos educacionais para dominar eletrônica e projeto de circuitos integrados. Do iniciante ao avançado, há algo para você.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }} flexWrap="wrap" useFlexGap>
        <Box sx={{ display: 'flex', border: '1px solid var(--color-line)', flexWrap: 'wrap' }}>
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setTab(k); setPage(1) }}
              className="filter-pill"
              style={{
                padding: '10px 16px',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                border: 'none',
                borderLeft: k === 'Todos' ? 'none' : '1px solid var(--color-line)',
                cursor: 'pointer',
                background: tab === k ? 'var(--color-accent)' : 'transparent',
                color: tab === k ? 'var(--brand-paper)' : 'var(--color-text)',
              }}
            >
              <span style={{ fontWeight: 600 }}>{k}</span>
              <span style={{ marginLeft: 8, opacity: tab === k ? 0.75 : 0.55 }}>{counts[k]}</span>
            </button>
          ))}
        </Box>

        <Box sx={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <input
            className="input"
            type="search"
            placeholder="Buscar por título ou descrição"
            aria-label="Buscar recursos"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <span style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Nível</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => { setLevel(lvl); setPage(1) }}
              className={level === lvl ? 'tag filter-pill' : 'tag tag-outline filter-pill'}
              style={level === lvl ? { background: 'var(--color-accent)', color: 'var(--brand-paper)', border: '1px solid var(--color-accent)', cursor: 'pointer' } : { cursor: 'pointer' }}
            >
              {lvl}
            </button>
          ))}
        </Stack>
      </Stack>

      {loading ? (
        <CardGridSkeleton count={6} columns={{ xs: 12, md: 6, lg: 4 }} />
      ) : pageItems.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 4 }}>Nenhum recurso encontrado</Typography>
      ) : (
        <RevealOnLoad>
          <Grid container spacing={4}>
            <AnimatePresence>
              {pageItems.map((r) => (
                <MotionGridItem
                  key={r.id}
                  size={{ xs: 12, md: 6, lg: 4 }}
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <RouterLink to={`/educacao/${r.id}`} className="card blueprint" style={{ padding: 0, textDecoration: 'none', color: 'inherit', gap: 0, display: 'flex', flexDirection: 'column' }}>
                    <DuotonePhoto
                      src={r.image_url}
                      alt={r.title}
                      label={r.category}
                      variant="category-watermark"
                      sx={{ borderBottom: '1px solid var(--color-line)' }}
                    />
                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>{r.category}{r.difficulty ? ` · ${r.difficulty}` : ''}</span>
                      <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '24px', lineHeight: '26px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                        {r.title}
                      </Typography>
                      <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>{r.description}</Typography>
                      <Typography sx={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>
                        Atualizado {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </RouterLink>
                </MotionGridItem>
              ))}
            </AnimatePresence>
          </Grid>
        </RevealOnLoad>
      )}

      {!loading && filtered.length > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </Typography>
          <Stack direction="row" spacing={1}>
            <button type="button" className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1
              return (
                <button key={n} type="button" className={n === page ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setPage(n)}>{n}</button>
              )
            })}
            <button type="button" className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>→</button>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
