import { Box, Grid, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { cursosApi, wikiApi } from '../services/api'
import type { CursoComArvore, WikiLink } from '../types'
import LexicalContent from '../components/LexicalContent'
import BlueprintFrame from '../components/design/BlueprintFrame'
import DuotonePhoto from '../components/design/DuotonePhoto'
import DetailPageSkeleton from '../components/design/DetailPageSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'
import BarraDeProgresso from '../components/design/BarraDeProgresso'
import ListaDeAulas from '../components/design/ListaDeAulas'
import { useProgressoDeCurso } from '../components/design/useProgressoDeCurso'
import { duracaoPorExtenso } from '../utils/duracao'

export default function Curso() {
  const { cursoSlug } = useParams<{ cursoSlug: string }>()
  const [curso, setCurso] = useState<CursoComArvore | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [verbetes, setVerbetes] = useState<WikiLink[]>([])
  const { concluida, concluidas, retomarEm } = useProgressoDeCurso()

  useEffect(() => {
    if (!cursoSlug) return

    setCarregando(true)
    cursosApi
      .getBySlug(cursoSlug)
      .then(setCurso)
      .catch((erro) => {
        if (import.meta.env.DEV) console.error('Erro ao carregar curso:', erro)
        setCurso(null)
      })
      .finally(() => setCarregando(false))
  }, [cursoSlug])

  /**
   * Os verbetes do curso são a união dos verbetes das aulas. É acessório: se
   * qualquer uma das chamadas falhar, a caixa some e o currículo continua
   * inteiro.
   */
  useEffect(() => {
    if (!curso) return

    const ids = curso.modulos.flatMap((m) => m.aulas.filter((a) => a.publicado).map((a) => a.id))
    if (ids.length === 0) return

    let cancelado = false
    Promise.all(ids.map((id) => wikiApi.getLinks('curso_aula', id).catch(() => [])))
      .then((listas) => {
        if (cancelado) return
        const porTermo = new Map<string, WikiLink>()
        for (const link of listas.flat()) {
          if (link.slug && !porTermo.has(link.slug)) porTermo.set(link.slug, link)
        }
        setVerbetes([...porTermo.values()])
      })
      .catch(() => {})

    return () => {
      cancelado = true
    }
  }, [curso])

  const slugsPublicados = useMemo(
    () =>
      curso
        ? curso.modulos.flatMap((m) => m.aulas.filter((a) => a.publicado).map((a) => a.slug))
        : [],
    [curso],
  )

  if (carregando) return <DetailPageSkeleton />

  if (!curso) {
    return (
      <Stack spacing={2}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 28, textTransform: 'uppercase' }}>
          Curso não encontrado
        </Typography>
        <RouterLink to="/cursos">Voltar aos Cursos</RouterLink>
      </Stack>
    )
  }

  const feitas = concluidas(curso.slug, slugsPublicados)
  const proxima = retomarEm(curso.slug, slugsPublicados)
  const comecou = feitas > 0
  const restante = curso.duracao_seg > 0 ? Math.round(curso.duracao_seg * (1 - feitas / Math.max(slugsPublicados.length, 1))) : 0

  // A numeração das aulas corre no curso inteiro, então cada módulo precisa
  // saber quantas vieram antes dele.
  let contadas = 0
  const numeroInicialPorModulo = curso.modulos.map((modulo) => {
    const inicio = contadas + 1
    contadas += modulo.aulas.length
    return inicio
  })

  return (
    <RevealOnLoad>
      <Stack spacing={4}>
        <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
          <RouterLink to="/">Início</RouterLink> / <RouterLink to="/cursos">Cursos</RouterLink> / {curso.titulo}
        </Typography>

        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <span className="tag tag-accent">Curso</span>
            {curso.nivel && <span className="tag tag-outline">{curso.nivel}</span>}
          </Stack>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: { xs: '36px', md: '56px' },
              lineHeight: { xs: '38px', md: '58px' },
              letterSpacing: '.01em',
              textTransform: 'uppercase',
              marginLeft: 'var(--optical-left)',
              maxWidth: '30ch',
            }}
          >
            {curso.titulo}
          </Typography>
          <Typography sx={{ fontSize: '17px', lineHeight: '26px', color: 'var(--color-text-muted)', maxWidth: '90ch' }}>
            {curso.descricao}
          </Typography>
        </Stack>

        {curso.image_url && (
          <BlueprintFrame duotone frameless>
            <DuotonePhoto src={curso.image_url} alt={curso.titulo} label="Capa" aspectRatio="21 / 9" sweepOnLoad />
          </BlueprintFrame>
        )}

        <Grid container spacing={7}>
          <Grid size={{ xs: 12, md: 8 }}>
            {curso.ementa && (
              <Box sx={{ mb: 4 }}>
                <LexicalContent content={curso.ementa} />
              </Box>
            )}

            {curso.modulos.length === 0 ? (
              <Typography sx={{ color: 'var(--color-text-muted)' }}>
                O currículo deste curso ainda está sendo montado.
              </Typography>
            ) : (
              curso.modulos.map((modulo, indice) => (
                <Box key={modulo.id} sx={{ mb: 3 }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="baseline"
                    flexWrap="wrap"
                    sx={{ px: 1.5, pt: 1.75, pb: 1, borderBottom: '1px solid var(--color-line-strong)' }}
                  >
                    <span style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>
                      Módulo {indice + 1}
                    </span>
                    <Typography
                      component="h2"
                      sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.02em' }}
                    >
                      {modulo.titulo}
                    </Typography>
                    <Typography sx={{ ml: 'auto', fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                      {modulo.aulas.length} {modulo.aulas.length === 1 ? 'aula' : 'aulas'}
                    </Typography>
                  </Stack>
                  {modulo.resumo && (
                    <Typography sx={{ px: 1.5, py: 1, fontSize: 15, color: 'var(--color-text-muted)' }}>
                      {modulo.resumo}
                    </Typography>
                  )}
                  <ListaDeAulas
                    aulas={modulo.aulas}
                    cursoSlug={curso.slug}
                    numeroInicial={numeroInicialPorModulo[indice]!}
                    concluida={(slug) => concluida(curso.slug, slug)}
                  />
                </Box>
              ))
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 96 } }}>
              <Stack spacing={4}>
                <BlueprintFrame sx={{ p: 2.5 }}>
                  <span className="kicker">Seu progresso</span>
                  <Box sx={{ my: 1.5 }}>
                    <BarraDeProgresso concluidas={feitas} total={slugsPublicados.length} />
                  </Box>
                  <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', mb: 2 }}>
                    {feitas} de {slugsPublicados.length}
                    {restante > 0 && feitas < slugsPublicados.length ? ` · restam ${duracaoPorExtenso(restante)}` : ''}
                  </Typography>

                  {proxima && (
                    <RouterLink
                      to={`/cursos/${curso.slug}/${proxima}`}
                      className="btn btn-primary"
                      style={{ width: '100%', textDecoration: 'none' }}
                    >
                      {comecou ? 'Retomar' : 'Começar o curso'}
                    </RouterLink>
                  )}

                  <Stack spacing={1.25} sx={{ mt: 2.5, pt: 2, borderTop: '1px solid var(--color-line)', fontSize: 14 }}>
                    {curso.nivel && (
                      <Stack direction="row" justifyContent="space-between">
                        <span style={{ color: 'var(--color-text-faint)' }}>Nível</span>
                        <span>{curso.nivel}</span>
                      </Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between">
                      <span style={{ color: 'var(--color-text-faint)' }}>Aulas</span>
                      <span>
                        {curso.total_aulas} em {curso.modulos.length}{' '}
                        {curso.modulos.length === 1 ? 'módulo' : 'módulos'}
                      </span>
                    </Stack>
                    {curso.duracao_seg > 0 && (
                      <Stack direction="row" justifyContent="space-between">
                        <span style={{ color: 'var(--color-text-faint)' }}>Duração</span>
                        <span>{duracaoPorExtenso(curso.duracao_seg)}</span>
                      </Stack>
                    )}
                    <Stack direction="row" justifyContent="space-between">
                      <span style={{ color: 'var(--color-text-faint)' }}>Atualizado</span>
                      <span>{new Date(curso.updated_at).toLocaleDateString('pt-BR')}</span>
                    </Stack>
                  </Stack>
                </BlueprintFrame>

                {verbetes.length > 0 && (
                  <BlueprintFrame sx={{ p: 2.5 }}>
                    <span className="kicker">Termos deste curso</span>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {verbetes.map((verbete) => (
                        <RouterLink key={verbete.id} to={`/wiki/${verbete.slug}`} className="tag tag-outline">
                          {verbete.term}
                        </RouterLink>
                      ))}
                    </Stack>
                  </BlueprintFrame>
                )}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </RevealOnLoad>
  )
}
