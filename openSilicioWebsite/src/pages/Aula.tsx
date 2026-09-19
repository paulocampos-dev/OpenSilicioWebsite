import { Box, Drawer, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
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
import ZerarProgresso from '../components/design/ZerarProgresso'
import { useAoChegarAoFim, useProgressoDeCurso } from '../components/design/useProgressoDeCurso'
import { duracaoPorExtenso } from '../utils/duracao'
import { contaveis } from '../utils/progressoDeCurso'

/** O galho que gira ao abrir o módulo. */
function Seta({ aberto, imovel }: { aberto: boolean; imovel: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={{ rotate: aberto ? 90 : 0 }}
      transition={{ duration: imovel ? 0 : 0.18, ease: 'easeOut' }}
      style={{ display: 'flex', color: 'var(--color-text-faint)' }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ display: 'block' }}>
        <path d="M3 1 L7 5 L3 9" fill="none" stroke="currentColor" strokeWidth={1.6} />
      </svg>
    </motion.span>
  )
}

/** Uma linha de aula da espinha: número (ou tique) e título. */
const linhaDeAula = {
  display: 'grid',
  gridTemplateColumns: '30px 1fr',
  alignItems: 'baseline',
  py: '8px',
  minHeight: { xs: 44, md: 0 },
} as const

/** A espinha: o curso inteiro, com a aula corrente marcada. */
function Espinha({
  curso,
  aulaAtual,
  feitas,
  total,
  concluida,
  podeZerar,
  aoZerar,
  aoNavegar,
}: {
  curso: CursoComArvore
  aulaAtual: string
  feitas: number
  total: number
  concluida: (slug: string) => boolean
  podeZerar: boolean
  aoZerar: () => void
  aoNavegar?: () => void
}) {
  const imovel = useReducedMotion() ?? false

  const moduloDaAtual = curso.modulos.find((m) =>
    m.aulas.some((a) => a.publicado && a.slug === aulaAtual),
  )?.id

  // Começa com tudo fechado e o efeito abre o módulo da aula: assim a abertura
  // na navegação e a do primeiro desenho são a mesma regra. Abrir só acrescenta
  // ao conjunto, para não fechar na cara de quem abriu outro módulo para olhar.
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    if (moduloDaAtual === undefined) return
    setAbertos((anteriores) =>
      anteriores.has(moduloDaAtual) ? anteriores : new Set(anteriores).add(moduloDaAtual),
    )
  }, [moduloDaAtual])

  const alternarModulo = (id: string, aberto: boolean) => {
    setAbertos((anteriores) => {
      const proximos = new Set(anteriores)
      if (aberto) proximos.add(id)
      else proximos.delete(id)
      return proximos
    })
  }

  return (
    <Box sx={{ pt: '28px', px: '24px', pb: '24px' }}>
      <span className="kicker" style={{ fontSize: 12 }}>Curso</span>
      <Typography
        component={RouterLink}
        to={`/cursos/${curso.slug}`}
        sx={{
          display: 'block',
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 26,
          lineHeight: '28px',
          textTransform: 'uppercase',
          letterSpacing: '.02em',
          textDecoration: 'none',
          color: 'var(--color-text)',
          mt: 0.5,
          mb: 2,
        }}
      >
        {curso.titulo}
      </Typography>

      <BarraDeProgresso concluidas={feitas} total={total} altura={6} />
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 1.25, mb: 1 }}
      >
        <Typography sx={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
          {feitas} de {total}
        </Typography>
        {podeZerar && <ZerarProgresso aoZerar={aoZerar} />}
      </Stack>

      {curso.modulos.map((modulo, indice) => {
        // Mesma regra do currículo: numeração corrida pelo curso, contando só
        // aula publicada, para não brigar com o "aula 3 de 5" do cabeçalho.
        const numeroInicial =
          curso.modulos
            .slice(0, indice)
            .reduce((soma, m) => soma + m.aulas.filter((a) => a.publicado).length, 0) + 1
        let publicadasAntes = 0

        // A conta do módulo é sobre as publicadas dele, opcionais incluídas: é
        // o que o leitor vê na lista logo abaixo. O total do curso, lá em cima,
        // é o outro: aquele tira as opcionais.
        const publicadas = modulo.aulas.filter((a) => a.publicado)
        const feitasNoModulo = publicadas.filter((a) => concluida(a.slug)).length
        const aberto = abertos.has(modulo.id)

        return (
          <Box
            key={modulo.id}
            component="details"
            open={aberto}
            onToggle={(evento) => alternarModulo(modulo.id, evento.currentTarget.open)}
            sx={{ borderTop: '1px solid var(--color-line)' }}
          >
            <Box
              component="summary"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: '14px',
                minHeight: { xs: 44, md: 0 },
                cursor: 'pointer',
                listStyle: 'none',
                '&::-webkit-details-marker': { display: 'none' },
                '&:focus-visible': { outline: '2px solid var(--color-accent)', outlineOffset: '2px' },
              }}
            >
              <Seta aberto={aberto} imovel={imovel} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>
                  Módulo {indice + 1}
                </Typography>
                <Typography sx={{ fontSize: 14, letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-text)' }}>
                  {modulo.titulo}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {publicadas.length === 0 ? 'em breve' : `${feitasNoModulo}/${publicadas.length}`}
              </Typography>
            </Box>

            <Box sx={{ pb: '10px' }}>
              {modulo.aulas.map((aula) => {
                if (!aula.publicado) {
                  return (
                    <Box key={aula.id} sx={{ ...linhaDeAula, opacity: 0.7 }}>
                      <span />
                      <Typography sx={{ fontSize: 16, lineHeight: '22px', color: 'var(--color-text-faint)' }}>
                        {aula.titulo}
                      </Typography>
                    </Box>
                  )
                }

                const numero = String(numeroInicial + publicadasAntes++).padStart(2, '0')
                const atual = aula.slug === aulaAtual
                const feita = concluida(aula.slug)

                return (
                  <Box
                    key={aula.id}
                    component={RouterLink}
                    to={`/cursos/${curso.slug}/${aula.slug}`}
                    onClick={aoNavegar}
                    aria-current={atual ? 'page' : undefined}
                    sx={{
                      ...linhaDeAula,
                      textDecoration: 'none',
                      // A borda ocupa lugar nas duas situações, senão a linha da
                      // aula corrente andaria três pixels para o lado.
                      borderLeft: `3px solid ${atual ? 'var(--color-accent)' : 'transparent'}`,
                      ml: '-12px',
                      pl: '9px',
                      // A corrente fica na cor cheia do texto: o steel-800 de
                      // antes sumia no fundo do modo escuro.
                      color: !atual && feita ? 'var(--color-text-muted)' : 'var(--color-text)',
                      '&:hover': { color: 'var(--color-accent)' },
                      '&:focus-visible': { outline: '2px solid var(--color-accent)', outlineOffset: '-2px' },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontSize: 13,
                        fontVariantNumeric: 'tabular-nums',
                        color: feita ? 'var(--color-accent)' : 'var(--color-text-faint)',
                      }}
                      aria-label={feita ? 'Concluída' : undefined}
                    >
                      {feita ? '✓' : numero}
                    </Box>
                    <Typography
                      sx={{ fontSize: 16, lineHeight: '22px', fontWeight: atual ? 600 : 400, color: 'inherit' }}
                    >
                      {aula.titulo}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )
      })}
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

  const { concluida, concluidas, temProgresso, alternar, marcarAutomatico, visitar, zerar } =
    useProgressoDeCurso()
  const { popoverProps, containerHandlers } = useWikiGlossary(verbetes)

  useEffect(() => {
    if (!cursoSlug || !aulaSlug) return

    setCarregando(true)
    setVerbetes([])

    // Esta página não desmonta ao trocar de aula, e a espinha convida a clicar
    // rápido. Sem a trava, uma resposta atrasada da aula anterior chegaria
    // depois e pintaria o conteúdo dela sob a URL da nova.
    let cancelado = false

    cursosApi
      .getAula(cursoSlug, aulaSlug)
      .then((resposta) => {
        if (cancelado) return
        setDados(resposta)
        // Acessório: sem os verbetes a aula continua legível, só sem popover.
        wikiApi
          .getLinks('curso_aula', resposta.aula.id)
          .then((links) => {
            if (!cancelado) setVerbetes(links)
          })
          .catch(() => {})
      })
      .catch((erro) => {
        if (cancelado) return
        if (import.meta.env.DEV) console.error('Erro ao carregar aula:', erro)
        setDados(null)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    // A árvore é a espinha. Vem de outra chamada porque a rota da aula devolve
    // só as vizinhas, e trazer o currículo inteiro junto de cada aula seria
    // repetir o mesmo dado a cada navegação.
    cursosApi
      .getBySlug(cursoSlug)
      .then((arvore) => {
        if (!cancelado) setCurso(arvore)
      })
      .catch(() => {
        if (!cancelado) setCurso(null)
      })

    return () => {
      cancelado = true
    }
  }, [cursoSlug, aulaSlug])

  useEffect(() => {
    if (cursoSlug && aulaSlug && dados) visitar(cursoSlug, aulaSlug)
  }, [cursoSlug, aulaSlug, dados, visitar])

  const publicadas = useMemo(
    () => (curso ? curso.modulos.flatMap((m) => m.aulas.filter((a) => a.publicado)) : []),
    [curso],
  )

  /**
   * A marcação automática só vale para aula com texto.
   *
   * O sentinela fica no pé do conteúdo, então numa aula só de vídeo ele já
   * nasce dentro da tela e a aula seria dada como concluída antes de o leitor
   * apertar o play. Saber que o vídeo acabou exigiria a iframe API do YouTube;
   * até lá, aula sem texto se marca no botão.
   */
  const fimDoTexto = useAoChegarAoFim(
    () => {
      if (cursoSlug && aulaSlug) marcarAutomatico(cursoSlug, aulaSlug)
    },
    Boolean(dados?.aula.conteudo),
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
  const feitas = concluidas(cursoSlug, publicadas)
  const estaFeita = concluida(cursoSlug, aulaSlug)

  const espinha = curso ? (
    <Espinha
      curso={curso}
      aulaAtual={aulaSlug}
      feitas={feitas}
      total={contaveis(publicadas).length}
      concluida={(slug) => concluida(cursoSlug, slug)}
      podeZerar={temProgresso(cursoSlug)}
      aoZerar={() => zerar(cursoSlug)}
      aoNavegar={() => setGavetaAberta(false)}
    />
  ) : null

  return (
    <RevealOnLoad>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' } }}>
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
            <Box sx={{ width: 'min(340px, 88vw)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: '12px', px: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setGavetaAberta(false)}>
                  Fechar
                </button>
              </Box>
              {espinha}
            </Box>
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
                  {aula.video_id ? 'Esta aula é só o vídeo.' : 'Esta aula ainda não tem conteúdo.'}
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
