import { Box, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { educationApi, wikiApi } from '../services/api'
import type { EducationResource, SeriesNavigation, WikiLink } from '../types'
import LexicalContent from '../components/LexicalContent'
import ShareAndCite from '../components/ShareAndCite'
import CoverLetterDisplay from '../components/CoverLetterDisplay'
import BlueprintFrame from '../components/design/BlueprintFrame'
import DuotonePhoto from '../components/design/DuotonePhoto'
import DetailPageSkeleton from '../components/design/DetailPageSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'
import useWikiGlossary from '../components/design/useWikiGlossary'
import { tempoDeLeitura } from '../utils/tempoDeLeitura'
import WikiPopover from '../components/design/WikiPopover'

const tabs = ['Visão geral', 'Conteúdo', 'Recursos'] as const

export default function Recurso() {
  const reduce = useReducedMotion()
  const { id } = useParams<{ id: string }>()
  const [resource, setResource] = useState<EducationResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Visão geral')
  const [wikiLinks, setWikiLinks] = useState<WikiLink[]>([])
  const [navegacao, setNavegacao] = useState<SeriesNavigation | null>(null)
  const { popoverProps, containerHandlers } = useWikiGlossary(wikiLinks)

  useEffect(() => {
    if (id) {
      loadResource()
    }
  }, [id])

  const loadResource = async () => {
    try {
      const data = await educationApi.getById(id!)
      setResource(data)
      wikiApi.getLinks('education', id!).then(setWikiLinks).catch(() => {})
      // A navegação é acessória: se falhar, a página continua completa sem ela.
      educationApi.getSeriesNavigation(id!).then(setNavegacao).catch(() => {})
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar recurso:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DetailPageSkeleton />
  }

  if (!resource) {
    return (
      <Stack spacing={2}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 28, textTransform: 'uppercase' }}>Recurso não encontrado</Typography>
        <RouterLink to="/educacao">Voltar à Educação</RouterLink>
      </Stack>
    )
  }

  const isProjeto = resource.category === 'Projetos'
  const sumario = (resource.toc_items || []).filter((item) => item.trim())
  const minutos = tempoDeLeitura(resource.content)
  const temBarraLateral = sumario.length > 0 || wikiLinks.length > 0

  return (
    <RevealOnLoad>
    <Stack spacing={4}>
      <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        <RouterLink to="/">Início</RouterLink> / <RouterLink to="/educacao">Educação</RouterLink> / {resource.title}
      </Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <span className="tag tag-accent">{resource.category}</span>
          {resource.difficulty && <span className="tag tag-neutral">{resource.difficulty}</span>}
        </Stack>
        <Typography component="h1" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: { xs: '36px', md: '56px' }, lineHeight: { xs: '38px', md: '58px' }, letterSpacing: '.01em', textTransform: 'uppercase', marginLeft: 'var(--optical-left)', maxWidth: '30ch' }}>
          {resource.title}
        </Typography>
        <Typography sx={{ fontSize: '17px', lineHeight: '26px', color: 'var(--color-text-muted)', maxWidth: '90ch' }}>{resource.description}</Typography>
        {(minutos !== null || navegacao?.position) && (
          <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
            {[
              minutos !== null ? `${minutos} min de leitura` : null,
              navegacao?.position ? `parte ${navegacao.position} de ${navegacao.total}` : null,
            ].filter(Boolean).join(' · ')}
          </Typography>
        )}
        <Box sx={{ maxWidth: '90ch' }}>
          <CoverLetterDisplay text={resource.cover_letter} variant="callout" />
        </Box>
      </Stack>

      {resource.image_url && (
        <BlueprintFrame duotone frameless>
          <DuotonePhoto src={resource.image_url} alt={resource.title} label="Capa" aspectRatio="21 / 9" sweepOnLoad />
        </BlueprintFrame>
      )}

      {isProjeto ? (
        <Box>
          <Box sx={{ display: 'flex', borderBottom: '1px solid var(--color-line)' }}>
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="filter-pill"
                style={{
                  padding: '12px 20px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: 20,
                  letterSpacing: '.03em',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
                  marginBottom: -1,
                  background: 'transparent',
                  color: tab === t ? 'var(--color-accent-ink)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </Box>
          <Grid container spacing={7} sx={{ pt: 4 }} {...containerHandlers}>
            <Grid size={{ xs: 12, md: 7 }}>
              <motion.div key={tab} initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
                {tab === 'Visão geral' && <LexicalContent content={resource.overview || ''} />}
                {tab === 'Conteúdo' && <LexicalContent content={resource.content} />}
                {tab === 'Recursos' && <LexicalContent content={resource.resources || ''} />}
              </motion.div>
            </Grid>
            {wikiLinks.length > 0 && (
              <Grid size={{ xs: 12, md: 5 }}>
                <BlueprintFrame sx={{ p: 2.5 }}>
                  <span className="kicker">Termos usados aqui</span>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {wikiLinks.map((link) => (
                      <RouterLink key={link.id} to={`/wiki/${link.slug}`} className="tag tag-outline">{link.term}</RouterLink>
                    ))}
                  </Stack>
                </BlueprintFrame>
              </Grid>
            )}
          </Grid>
        </Box>
      ) : (
        <Grid container spacing={7} {...containerHandlers}>
          <Grid size={{ xs: 12, md: temBarraLateral ? 8 : 12 }}>
            <LexicalContent content={resource.content} />
          </Grid>
          {temBarraLateral && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                {sumario.length > 0 && (
                  <BlueprintFrame sx={{ p: 2.5 }}>
                    <span className="kicker">Nesta página</span>
                    <Stack spacing={1}>
                      {sumario.map((item, index) => (
                        <Typography key={index} sx={{ fontSize: '15px', lineHeight: '22px' }}>{item}</Typography>
                      ))}
                    </Stack>
                  </BlueprintFrame>
                )}
                {wikiLinks.length > 0 && (
                  <BlueprintFrame sx={{ p: 2.5 }}>
                    <span className="kicker">Termos usados aqui</span>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {wikiLinks.map((link) => (
                        <RouterLink key={link.id} to={`/wiki/${link.slug}`} className="tag tag-outline">{link.term}</RouterLink>
                      ))}
                    </Stack>
                  </BlueprintFrame>
                )}
              </Stack>
            </Grid>
          )}
        </Grid>
      )}

      {navegacao && (navegacao.previous || navegacao.next) && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            borderTop: '1px solid var(--color-line)',
            pt: 3,
          }}
        >
          {/* O item ausente vira um espaço vazio para o "próximo" não pular
              para a coluna da esquerda quando não existe anterior. */}
          {navegacao.previous ? (
            <RouterLink to={`/educacao/${navegacao.previous.id}`} style={{ textDecoration: 'none' }}>
              <BlueprintFrame sx={{ p: 2.5, height: '100%' }}>
                <span className="kicker">Anterior</span>
                <Typography sx={{ fontSize: '17px', lineHeight: '24px', color: 'var(--color-text)' }}>
                  {navegacao.previous.title}
                </Typography>
              </BlueprintFrame>
            </RouterLink>
          ) : (
            <Box />
          )}
          {navegacao.next && (
            <RouterLink to={`/educacao/${navegacao.next.id}`} style={{ textDecoration: 'none' }}>
              <BlueprintFrame sx={{ p: 2.5, height: '100%', textAlign: 'right' }}>
                <span className="kicker">Próximo</span>
                <Typography sx={{ fontSize: '17px', lineHeight: '24px', color: 'var(--color-text)' }}>
                  {navegacao.next.title}
                </Typography>
              </BlueprintFrame>
            </RouterLink>
          )}
        </Box>
      )}

      <ShareAndCite
        title={resource.title}
        author="OpenSilício Team"
        url={`/educacao/${resource.id}`}
        imageUrl={resource.image_url || ''}
        publishedDate={resource.created_at}
      />
      <WikiPopover {...popoverProps} />
    </Stack>
    </RevealOnLoad>
  )
}
