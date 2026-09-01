import { Box, Drawer, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { cursosApi, wikiApi } from '../services/api'
import type { AulaComVizinhas, CursoComArvore, WikiLink } from '../types'
import LexicalContent from '../components/LexicalContent'
import ShareAndCite from '../components/ShareAndCite'
import BlueprintFrame from '../components/design/BlueprintFrame'
import DetailPageSkeleton from '../components/design/DetailPageSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'
import BarraDeProgresso from '../components/design/BarraDeProgresso'
import WikiPopover from '../components/design/WikiPopover'
import useWikiGlossary from '../components/design/useWikiGlossary'
import { useAoChegarAoFim, useProgressoDeCurso } from '../components/design/useProgressoDeCurso'
import { duracaoPorExtenso } from '../utils/duracao'

/** A espinha: o curso inteiro, com a aula corrente marcada. */
function Espinha({
  curso,
  aulaAtual,
  feitas,
  total,
  concluida,
  aoNavegar,
}: {
  curso: CursoComArvore
  aulaAtual: string
  feitas: number
  total: number
  concluida: (slug: string) => boolean
  aoNavegar?: () => void
}) {
  return (
    <Box sx={{ p: 2.25 }}>
      <span className="kicker" style={{ fontSize: 12 }}>Curso</span>
      <Typography
        component={RouterLink}
        to={`/cursos/${curso.slug}`}
        sx={{
          display: 'block',
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 22,
          lineHeight: '23px',
          textTransform: 'uppercase',
          letterSpacing: '.02em',
          textDecoration: 'none',
          color: 'var(--color-text)',
          mt: 0.5,
          mb: 1.5,
        }}
      >
        {curso.titulo}
      </Typography>

      <BarraDeProgresso concluidas={feitas} total={total} />
      <Typography sx={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', mt: 1, mb: 2.5 }}>
        {feitas} de {total}
      </Typography>

      {curso.modulos.map((modulo, indice) => (
        <Box key={modulo.id} sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600, mb: 0.5 }}>
            Módulo {indice + 1} · {modulo.titulo}
          </Typography>
          <Stack spacing={0.25}>
            {modulo.aulas.map((aula) => {
              if (!aula.publicado) {
                return (
                  <Typography key={aula.id} sx={{ fontSize: 14, color: 'var(--color-text-faint)', opacity: 0.7 }}>
                    {aula.titulo}
                  </Typography>
                )
              }

              const atual = aula.slug === aulaAtual
              return (
                <Typography
                  key={aula.id}
                  component={RouterLink}
                  to={`/cursos/${curso.slug}/${aula.slug}`}
                  onClick={aoNavegar}
                  aria-current={atual ? 'page' : undefined}
                  sx={{
                    fontSize: 14,
                    textDecoration: 'none',
                    color: atual ? 'var(--color-steel-800)' : concluida(aula.slug) ? 'var(--color-text-muted)' : 'var(--color-text)',
                    fontWeight: atual ? 600 : 400,
                    borderLeft: atual ? '2px solid var(--color-accent)' : '2px solid transparent',
                    ml: atual ? '-10px' : 0,
                    pl: atual ? '8px' : 0,
                    '&:hover': { color: 'var(--color-accent-ink)' },
                  }}
                >
                  {aula.titulo}
                </Typography>
              )
            })}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}

export default function Aula() {
  const { cursoSlug, aulaSlug } = useParams<{ cursoSlug: string; aulaSlug: string }>()
  const tema = useTheme()
  const noCelular = useMediaQuery(tema.breakpoints.down('md'))

  const [dados, setDados] = useState<AulaComVizinhas | null>(null)
  const [curso, setCurso] = useState<CursoComArvore | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [verbetes, setVerbetes] = useState<WikiLink[]>([])
  const [gavetaAberta, setGavetaAberta] = useState(false)

  const { concluida, concluidas, alternar, marcarAutomatico, visitar } = useProgressoDeCurso()
  const { popoverProps, containerHandlers } = useWikiGlossary(verbetes)
  const fimDoTexto = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cursoSlug || !aulaSlug) return

    setCarregando(true)
    setVerbetes([])

    cursosApi
      .getAula(cursoSlug, aulaSlug)
      .then((resposta) => {
        setDados(resposta)
        // Acessório: sem os verbetes a aula continua legível, só sem popover.
        wikiApi.getLinks('curso_aula', resposta.aula.id).then(setVerbetes).catch(() => {})
      })
      .catch((erro) => {
        if (import.meta.env.DEV) console.error('Erro ao carregar aula:', erro)
        setDados(null)
      })
      .finally(() => setCarregando(false))

    // A árvore é a espinha. Vem de outra chamada porque a rota da aula devolve
    // só as vizinhas, e trazer o currículo inteiro junto de cada aula seria
    // repetir o mesmo dado a cada navegação.
    cursosApi.getBySlug(cursoSlug).then(setCurso).catch(() => setCurso(null))
  }, [cursoSlug, aulaSlug])

  useEffect(() => {
    if (cursoSlug && aulaSlug && dados) visitar(cursoSlug, aulaSlug)
  }, [cursoSlug, aulaSlug, dados, visitar])

  const slugsPublicados = useMemo(
    () =>
      curso
        ? curso.modulos.flatMap((m) => m.aulas.filter((a) => a.publicado).map((a) => a.slug))
        : [],
    [curso],
  )

  useAoChegarAoFim(
    fimDoTexto,
    () => {
      if (cursoSlug && aulaSlug) marcarAutomatico(cursoSlug, aulaSlug)
    },
    Boolean(dados),
  )

  if (carregando) return <DetailPageSkeleton />

  if (!dados || !cursoSlug || !aulaSlug) {
    return (
      <Stack spacing={2}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 28, textTransform: 'uppercase' }}>
          Aula não encontrada
        </Typography>
        <RouterLink to="/cursos">Voltar aos Cursos</RouterLink>
      </Stack>
    )
  }

  const { aula, modulo, posicao, total, anterior, proxima } = dados
  const feitas = concluidas(cursoSlug, slugsPublicados)
  const estaFeita = concluida(cursoSlug, aulaSlug)

  const espinha = curso ? (
    <Espinha
      curso={curso}
      aulaAtual={aulaSlug}
      feitas={feitas}
      total={slugsPublicados.length}
      concluida={(slug) => concluida(cursoSlug, slug)}
      aoNavegar={() => setGavetaAberta(false)}
    />
  ) : null

  return (
    <RevealOnLoad>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' } }}>
        {!noCelular && espinha && (
          <Box
            component="aside"
            sx={{
              borderRight: '1px solid var(--color-line)',
              position: 'sticky',
              top: 88,
              alignSelf: 'start',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}
          >
            {espinha}
          </Box>
        )}

        {noCelular && (
          <Drawer anchor="left" open={gavetaAberta} onClose={() => setGavetaAberta(false)}>
            <Box sx={{ width: 288 }}>{espinha}</Box>
          </Drawer>
        )}

        <Box sx={{ pl: { md: 4 }, minWidth: 0 }}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                <RouterLink to="/cursos">Cursos</RouterLink> /{' '}
                <RouterLink to={`/cursos/${cursoSlug}`}>{dados.curso.titulo}</RouterLink> / {modulo.titulo}
              </Typography>
              {noCelular && (
                <button type="button" className="btn btn-secondary" onClick={() => setGavetaAberta(true)} style={{ marginLeft: 'auto' }}>
                  Aulas
                </button>
              )}
            </Stack>

            <Stack spacing={1.5}>
              <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                {[
                  `Aula ${posicao} de ${total}`,
                  aula.duracao_seg ? duracaoPorExtenso(aula.duracao_seg) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: { xs: '32px', md: '44px' },
                  lineHeight: { xs: '34px', md: '46px' },
                  letterSpacing: '.01em',
                  textTransform: 'uppercase',
                  marginLeft: 'var(--optical-left)',
                  maxWidth: '28ch',
                }}
              >
                {aula.titulo}
              </Typography>
            </Stack>

            {aula.video_id && (
              <BlueprintFrame>
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <Box
                    component="iframe"
                    // youtube-nocookie é o mesmo host do YouTubeNode do editor,
                    // então o consentimento de cookies não muda por causa disto.
                    src={`https://www.youtube-nocookie.com/embed/${aula.video_id}`}
                    title={aula.titulo}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  />
                </Box>
              </BlueprintFrame>
            )}

            <Box {...containerHandlers}>
              {aula.conteudo ? (
                <LexicalContent content={aula.conteudo} />
              ) : (
                <Typography sx={{ color: 'var(--color-text-muted)' }}>
                  Esta aula é só o vídeo.
                </Typography>
              )}
            </Box>

            {/* O sentinela da marcação automática. Fica depois do texto, então
                só cruza a tela quando o leitor chega ao fim. */}
            <div ref={fimDoTexto} aria-hidden="true" />

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <button
                type="button"
                className={estaFeita ? 'btn btn-primary' : 'btn btn-secondary'}
                aria-pressed={estaFeita}
                onClick={() => alternar(cursoSlug, aulaSlug, !estaFeita)}
              >
                {estaFeita ? 'Concluída' : 'Marcar como concluída'}
              </button>
              <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                Fica guardado só neste navegador
              </Typography>
            </Stack>

            {verbetes.length > 0 && (
              <BlueprintFrame sx={{ p: 2.5 }}>
                <span className="kicker">Termos usados aqui</span>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  {verbetes.map((verbete) => (
                    <RouterLink key={verbete.id} to={`/wiki/${verbete.slug}`} className="tag tag-outline">
                      {verbete.term}
                    </RouterLink>
                  ))}
                </Stack>
              </BlueprintFrame>
            )}

            {(anterior || proxima) && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  borderTop: '1px solid var(--color-line)',
                  pt: 3,
                }}
              >
                {anterior ? (
                  <RouterLink to={`/cursos/${cursoSlug}/${anterior.slug}`} style={{ textDecoration: 'none' }}>
                    <BlueprintFrame sx={{ p: 2.5, height: '100%' }}>
                      <span className="kicker">Anterior</span>
                      <Typography sx={{ fontSize: '17px', lineHeight: '24px', color: 'var(--color-text)' }}>
                        {anterior.titulo}
                      </Typography>
                    </BlueprintFrame>
                  </RouterLink>
                ) : (
                  <Box />
                )}
                {proxima && (
                  <RouterLink to={`/cursos/${cursoSlug}/${proxima.slug}`} style={{ textDecoration: 'none' }}>
                    <BlueprintFrame sx={{ p: 2.5, height: '100%', textAlign: 'right' }}>
                      <span className="kicker">Próxima</span>
                      <Typography sx={{ fontSize: '17px', lineHeight: '24px', color: 'var(--color-text)' }}>
                        {proxima.titulo}
                      </Typography>
                    </BlueprintFrame>
                  </RouterLink>
                )}
              </Box>
            )}

            <ShareAndCite
              title={aula.titulo}
              author="OpenSilício Team"
              url={`/cursos/${cursoSlug}/${aulaSlug}`}
              imageUrl=""
              publishedDate={aula.created_at}
            />
          </Stack>
        </Box>
      </Box>
      <WikiPopover {...popoverProps} />
    </RevealOnLoad>
  )
}
