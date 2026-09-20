import { Box, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { cursosApi } from '../services/api'
import type { CursoNaListagem } from '../types'
import BarraDeProgresso from '../components/design/BarraDeProgresso'
import BlueprintFrame from '../components/design/BlueprintFrame'
import ErroAoCarregar from '../components/design/ErroAoCarregar'
import RevealOnLoad from '../components/design/RevealOnLoad'
import SkeletonBlock from '../components/design/SkeletonBlock'
import { useProgressoDeCurso } from '../components/design/useProgressoDeCurso'
import { duracaoPorExtenso } from '../utils/duracao'
import { atividadesDaListagem, hrefDaAtividade } from '../utils/atividadesDeCurso'
import {
  contarAtividadesConcluidas,
  proximaAtividade,
} from '../utils/progressoDeCurso'

const colunas = { xs: '1fr', md: '1fr 110px 130px 84px 150px' }

function Cabecalho() {
  const celula = {
    fontSize: 11,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: 'var(--color-text-faint)',
    fontWeight: 600,
  } as const

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'grid' },
        gridTemplateColumns: colunas,
        gap: 2.5,
        px: 1.5,
        py: 1,
        borderBottom: '1px solid var(--color-line-strong)',
      }}
    >
      <span style={celula}>Curso</span>
      <span style={celula}>Nível</span>
      <span style={celula}>Atividades</span>
      <span style={celula}>Duração</span>
      <span style={celula}>Progresso</span>
    </Box>
  )
}

export default function Cursos() {
  const [cursos, setCursos] = useState<CursoNaListagem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const { progresso, concluida, temProgresso } = useProgressoDeCurso()

  useEffect(() => {
    carregar()
  }, [])

  const carregar = () => {
    setCarregando(true)
    setErro(false)
    cursosApi
      .getAll(1, 50)
      .then((resposta) => setCursos(resposta.data))
      .catch((motivo) => {
        setErro(true)
        if (import.meta.env.DEV) console.error('Erro ao carregar cursos:', motivo)
      })
      .finally(() => setCarregando(false))
  }

  /**
   * O curso a retomar é o mais recente que já foi começado e ainda não acabou.
   * Sem nenhum, o painel some e a página é só o índice, que é o que um visitante
   * de primeira viagem deve ver.
   */
  const emAndamento = useMemo(() => {
    for (const curso of cursos) {
      const atividades = atividadesDaListagem(curso)
      const total = atividades.filter(
        (atividade) => atividade.tipo === 'quiz' || !atividade.opcional,
      ).length
      const feitas = contarAtividadesConcluidas(progresso, curso.slug, atividades)
      if (temProgresso(curso.slug) && feitas < total) {
        const proxima = proximaAtividade(progresso, curso.slug, atividades)
        const indice = proxima ? atividades.findIndex((atividade) => atividade.tipo === proxima.tipo && atividade.slug === proxima.slug) : -1
        if (proxima) {
          // A posição é a da aula que o botão abre, não a contagem de
          // concluídas: quem terminou a 1 e a 3 e vai retomar a 2 tem que ler
          // "aula 2", e não "aula 3". Conta só as que valem progresso, para
          // bater com o total ao lado; retomar numa opcional mostra a posição
          // da última que conta antes dela.
          //
          // O tempo restante soma a duração das aulas que faltam de verdade,
          // uma a uma, e só as que contam. Uma regra de três sobre a duração
          // total erraria sempre que as aulas tivessem tamanhos diferentes, que
          // é o caso normal.
          const restante = atividades
            .filter(
              (atividade) =>
                atividade.tipo === 'aula' &&
                !atividade.opcional &&
                !concluida(curso.slug, atividade.slug),
            )
            .reduce(
              (soma, atividade) =>
                soma + (atividade.tipo === 'aula' ? atividade.duracao_seg ?? 0 : 0),
              0,
            )

          const posicao = Math.max(
            1,
            atividades.slice(0, indice + 1).filter(
              (atividade) => atividade.tipo === 'quiz' || !atividade.opcional,
            ).length,
          )

          return { curso, proxima, feitas, posicao, total, restante }
        }
      }
    }
    return null
  }, [cursos, concluida, progresso, temProgresso])

  return (
    <Stack spacing={5}>
      <Stack spacing={1.5}>
        <Typography
          component="h2"
          sx={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: { xs: '40px', md: '56px' },
            lineHeight: { xs: '42px', md: '58px' },
            letterSpacing: '.01em',
            textTransform: 'uppercase',
            marginLeft: 'var(--optical-left)',
          }}
        >
          Cursos
        </Typography>
        <Typography sx={{ fontSize: '17px', lineHeight: '26px', maxWidth: '64ch', color: 'var(--color-text-muted)' }}>
          Trilhas completas, em aulas curtas e na ordem certa. Seu progresso fica guardado neste navegador.
        </Typography>
      </Stack>

      {emAndamento && (
        <BlueprintFrame sx={{ p: 3 }}>
          <span className="kicker" style={{ color: 'var(--color-accent)' }}>Continuar</span>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ xs: 'stretch', md: 'flex-end' }}
            sx={{ mt: 1 }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="h3"
                sx={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '30px',
                  lineHeight: '32px',
                  textTransform: 'uppercase',
                  letterSpacing: '.02em',
                }}
              >
                {emAndamento.curso.titulo}
              </Typography>
              <Typography sx={{ color: 'var(--color-text-muted)', mt: 0.75, mb: 1.5 }}>
                Atividade {emAndamento.posicao} de {emAndamento.total}
              </Typography>
              <BarraDeProgresso concluidas={emAndamento.feitas} total={emAndamento.total} />
              <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', mt: 1 }}>
                {[
                  `${emAndamento.feitas} de ${emAndamento.total} atividades concluídas`,
                  emAndamento.restante > 0 ? `restam ${duracaoPorExtenso(emAndamento.restante)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
            <RouterLink
              to={hrefDaAtividade(emAndamento.curso.slug, emAndamento.proxima)}
              className="btn btn-primary"
              style={{ textDecoration: 'none', flex: 'none' }}
            >
              Retomar: {emAndamento.proxima.titulo}
            </RouterLink>
          </Stack>
        </BlueprintFrame>
      )}

      {carregando ? (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} height={72} />
          ))}
        </Stack>
      ) : erro ? (
        <ErroAoCarregar aoTentarDeNovo={carregar} />
      ) : cursos.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 4, color: 'var(--color-text-muted)' }}>
          Nenhum curso publicado ainda.
        </Typography>
      ) : (
        <RevealOnLoad>
          <Cabecalho />
          {cursos.map((curso) => {
            const atividades = atividadesDaListagem(curso)
            const total = atividades.filter(
              (atividade) => atividade.tipo === 'quiz' || !atividade.opcional,
            ).length
            const feitas = contarAtividadesConcluidas(progresso, curso.slug, atividades)

            return (
              <Box
                key={curso.id}
                component={RouterLink}
                to={`/cursos/${curso.slug}`}
                className="filter-pill"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: colunas,
                  gap: { xs: 1, md: 2.5 },
                  alignItems: 'center',
                  px: 1.5,
                  py: 2,
                  borderBottom: '1px solid var(--color-line)',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      fontSize: '26px',
                      lineHeight: '27px',
                      textTransform: 'uppercase',
                      letterSpacing: '.02em',
                    }}
                  >
                    {curso.titulo}
                  </Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: '22px', color: 'var(--color-text-muted)', mt: 0.5, maxWidth: '58ch' }}>
                    {curso.descricao}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{curso.nivel ?? ''}</Typography>
                <Typography sx={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                  {curso.aulas + curso.quizzes} ({curso.aulas} aulas) em {curso.modulos}{' '}
                  {curso.modulos === 1 ? 'módulo' : 'módulos'}
                </Typography>
                <Typography sx={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                  {duracaoPorExtenso(curso.duracao_seg) || '—'}
                </Typography>

                <Box>
                  <BarraDeProgresso concluidas={feitas} total={total} rotulo={`Progresso em ${curso.titulo}`} />
                  <Typography sx={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)', mt: 0.75 }}>
                    {total === 0
                      ? 'em breve'
                      : feitas === 0
                        ? 'não iniciado'
                        : feitas === total
                          ? 'concluído'
                          : `${feitas} de ${total}`}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </RevealOnLoad>
      )}
    </Stack>
  )
}
