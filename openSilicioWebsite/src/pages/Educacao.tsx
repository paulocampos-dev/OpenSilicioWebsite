import { Box, Grid, Stack, Typography } from '@mui/material'
import { useMemo, useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cursosApi, educationApi } from '../services/api'
import type { CursoNaListagem, EducationResource } from '../types'
import DuotonePhoto from '../components/design/DuotonePhoto'
import CardGridSkeleton from '../components/design/CardGridSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'
import Pager from '../components/design/Pager'
import { usePagedFilter } from '../components/design/usePagedFilter'
import { duracaoPorExtenso } from '../utils/duracao'

const MotionGridItem = motion.create(Grid)

type Level = 'Todos' | 'Iniciante' | 'Intermediário' | 'Avançado'
type Kind = 'Todos' | 'Cursos' | 'Projetos' | 'Guias' | 'Tutoriais' | 'Teóricos'

const kinds: Kind[] = ['Todos', 'Cursos', 'Projetos', 'Guias', 'Tutoriais', 'Teóricos']
const levels: Level[] = ['Todos', 'Iniciante', 'Intermediário', 'Avançado']

/**
 * A forma única que a grade sabe desenhar.
 *
 * Um curso e um recurso são coisas diferentes no banco e em quase todo o site,
 * mas aqui aparecem lado a lado. Normalizar na borda, com um adaptador para
 * cada origem, evita espalhar uma união por toda a página.
 */
interface CartaoEducacao {
  chave: string
  href: string
  titulo: string
  descricao: string
  imagem: string | null
  categoria: Exclude<Kind, 'Todos'>
  nivel: string | null
  meta: string
  /** Texto onde a busca procura, que não é necessariamente o texto exibido. */
  buscavel: string
  data: string
}

const cartaoDeRecurso = (recurso: EducationResource): CartaoEducacao => ({
  chave: `recurso-${recurso.id}`,
  href: `/educacao/${recurso.id}`,
  titulo: recurso.title,
  descricao: recurso.description,
  imagem: recurso.image_url ?? null,
  categoria: (recurso.category as Exclude<Kind, 'Todos'>) ?? 'Guias',
  nivel: recurso.difficulty ?? null,
  meta: `Atualizado ${new Date(recurso.created_at).toLocaleDateString('pt-BR')}`,
  buscavel: `${recurso.title} ${recurso.description}`.toLowerCase(),
  data: recurso.created_at,
})

/**
 * O curso entra como um cartão só, e não uma aula por cartão: um curso de
 * quinze aulas afogaria os recursos avulsos na grade. Em compensação os títulos
 * das aulas entram no texto buscável, senão procurar por "Yosys" aqui não
 * acharia a aula que fala disso.
 */
const cartaoDeCurso = (curso: CursoNaListagem): CartaoEducacao => ({
  chave: `curso-${curso.id}`,
  href: `/cursos/${curso.slug}`,
  titulo: curso.titulo,
  descricao: curso.descricao,
  imagem: curso.image_url ?? null,
  categoria: 'Cursos',
  nivel: curso.nivel ?? null,
  meta: [
    `${curso.modulos} ${curso.modulos === 1 ? 'módulo' : 'módulos'}`,
    `${curso.aulas} ${curso.aulas === 1 ? 'aula' : 'aulas'}`,
    duracaoPorExtenso(curso.duracao_seg),
  ]
    .filter(Boolean)
    .join(' · '),
  buscavel: `${curso.titulo} ${curso.descricao} ${curso.aulas_publicadas.map((a) => a.titulo).join(' ')}`.toLowerCase(),
  data: curso.created_at,
})

export default function Educacao() {
  const reduce = useReducedMotion()
  const [tab, setTab] = useState<Kind>('Todos')
  const [level, setLevel] = useState<Level>('Todos')
  const [query, setQuery] = useState<string>('')
  const [cartoes, setCartoes] = useState<CartaoEducacao[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 6

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    try {
      // As duas origens em paralelo: uma falhar não pode esvaziar a página toda.
      const [recursos, cursos] = await Promise.all([
        educationApi.getAll(true, 1, 100).catch(() => null),
        cursosApi.getAll(true, 1, 100).catch(() => null),
      ])

      const lista = [
        ...(cursos?.data ?? []).map(cartaoDeCurso),
        ...(recursos?.data ?? []).map(cartaoDeRecurso),
      ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

      setCartoes(lista)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar recursos:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<Kind, number> = {
      Todos: cartoes.length,
      Cursos: 0,
      Projetos: 0,
      Guias: 0,
      Tutoriais: 0,
      Teóricos: 0,
    }
    for (const cartao of cartoes) {
      if (cartao.categoria in c) c[cartao.categoria] += 1
    }
    return c
  }, [cartoes])

  const { pageItems, filteredCount, page, totalPages, setPage } = usePagedFilter(cartoes, {
    pageSize,
    filterFn: (cartao) => {
      const matchesTab = tab === 'Todos' || cartao.categoria === tab
      const matchesLevel = level === 'Todos' || cartao.nivel === level
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || cartao.buscavel.includes(q)
      return matchesTab && matchesLevel && matchesQuery
    },
    deps: [tab, level, query],
  })

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
              onClick={() => setTab(k)}
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
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <span style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Nível</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevel(lvl)}
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
              {pageItems.map((cartao) => (
                <MotionGridItem
                  key={cartao.chave}
                  size={{ xs: 12, md: 6, lg: 4 }}
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <RouterLink to={cartao.href} className="card blueprint" style={{ padding: 0, textDecoration: 'none', color: 'inherit', gap: 0, display: 'flex', flexDirection: 'column' }}>
                    <DuotonePhoto
                      {...(cartao.imagem ? { src: cartao.imagem } : {})}
                      alt={cartao.titulo}
                      label={cartao.categoria}
                      variant="category-watermark"
                      sx={{ borderBottom: '1px solid var(--color-line)' }}
                    />
                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>
                        {cartao.categoria}{cartao.nivel ? ` · ${cartao.nivel}` : ''}
                      </span>
                      <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '24px', lineHeight: '26px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                        {cartao.titulo}
                      </Typography>
                      <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>{cartao.descricao}</Typography>
                      <Typography sx={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>{cartao.meta}</Typography>
                    </Box>
                  </RouterLink>
                </MotionGridItem>
              ))}
            </AnimatePresence>
          </Grid>
        </RevealOnLoad>
      )}

      {!loading && filteredCount > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredCount)} de {filteredCount}
          </Typography>
          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </Stack>
      )}
    </Stack>
  )
}
