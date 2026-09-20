import { Box, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { AulaNaArvore, ModuloNaArvore, QuizNaArvore } from '../../types'
import { duracaoPorExtenso } from '../../utils/duracao'
import type { UltimaAtividade } from '../../utils/progressoDeCurso'

function GlifoDeAula({ video }: { video: boolean }) {
  return video ? (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M2 1 L10 6 L2 11 Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M1 3h14M1 7h14M1 11h9" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  )
}

function GlifoDeQuiz() {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, lineHeight: 1 }}
    >
      ?
    </Box>
  )
}

function Tique() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true" style={{ display: 'block' }}>
      <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const grade = {
  display: 'grid',
  gridTemplateColumns: '34px 18px 1fr auto 20px',
  gap: 1.5,
  alignItems: 'center',
  padding: '9px 12px',
  borderBottom: '1px solid var(--color-line)',
} as const

type Linha =
  | { tipo: 'aula'; item: AulaNaArvore; numero: string }
  | { tipo: 'quiz'; item: QuizNaArvore }

function linhasDoModulo(modulo: ModuloNaArvore, numeroInicial: number): Linha[] {
  const linhas: Linha[] = []
  let publicadasAntes = 0

  for (const aula of modulo.aulas) {
    linhas.push({
      tipo: 'aula',
      item: aula,
      numero: aula.publicado ? String(numeroInicial + publicadasAntes++).padStart(2, '0') : '',
    })
    const quiz = modulo.quizzes.find((item) => item.aula_id === aula.id)
    if (quiz) linhas.push({ tipo: 'quiz', item: quiz })
  }

  for (const quiz of modulo.quizzes) {
    if (quiz.aula_id === null) linhas.push({ tipo: 'quiz', item: quiz })
  }
  return linhas
}

interface ListaDeAtividadesProps {
  modulo: ModuloNaArvore
  cursoSlug: string
  numeroInicial: number
  aulaConcluida: (slug: string) => boolean
  notaDoQuiz: (slug: string) => number | null
  quizConcluido: (slug: string, notaMinima: number) => boolean
  atividadeAtual?: UltimaAtividade | undefined
  aoNavegar?: (() => void) | undefined
}

export default function ListaDeAtividades({
  modulo,
  cursoSlug,
  numeroInicial,
  aulaConcluida,
  notaDoQuiz,
  quizConcluido,
  atividadeAtual,
  aoNavegar,
}: ListaDeAtividadesProps) {
  return (
    <Box>
      {linhasDoModulo(modulo, numeroInicial).map((linha) => {
        if (!linha.item.publicado) {
          return (
            <Box key={`${linha.tipo}-${linha.item.id}`} data-testid="atividade" sx={{ ...grade, opacity: 0.55 }}>
              <span />
              <span>{linha.tipo === 'quiz' ? <GlifoDeQuiz /> : null}</span>
              <Typography sx={{ fontSize: 15, color: 'var(--color-text-muted)' }}>
                {linha.item.titulo}
              </Typography>
              <span style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                em breve
              </span>
              <span />
            </Box>
          )
        }

        if (linha.tipo === 'aula') {
          const aula = linha.item
          const atual = atividadeAtual?.tipo === 'aula' && atividadeAtual.slug === aula.slug
          const feita = aulaConcluida(aula.slug)
          return (
            <Box
              key={aula.id}
              data-testid="atividade"
              component={RouterLink}
              to={`/cursos/${cursoSlug}/${aula.slug}`}
              onClick={aoNavegar}
              aria-current={atual ? 'page' : undefined}
              className="filter-pill"
              sx={{
                ...grade,
                textDecoration: 'none',
                color: 'inherit',
                background: atual
                  ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                  : 'transparent',
                '&:hover': { background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' },
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {linha.numero}
              </span>
              <span style={{ color: aula.tem_video ? 'var(--color-accent)' : 'var(--color-text-faint)' }}>
                <GlifoDeAula video={aula.tem_video} />
              </span>
              <Typography sx={{ fontSize: 15, fontWeight: atual ? 600 : 400, color: feita ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                {aula.titulo}
                {aula.opcional && (
                  <span style={{ marginLeft: 8, fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                    opcional
                  </span>
                )}
              </Typography>
              <span style={{ fontSize: 13, color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {aula.duracao_seg ? duracaoPorExtenso(aula.duracao_seg) : 'leitura'}
              </span>
              <span style={{ color: 'var(--color-accent)' }} aria-label={feita ? 'Concluída' : undefined}>
                {feita ? <Tique /> : null}
              </span>
            </Box>
          )
        }

        const quiz = linha.item
        const nota = notaDoQuiz(quiz.slug)
        const concluido = quizConcluido(quiz.slug, quiz.nota_minima)
        const atual = atividadeAtual?.tipo === 'quiz' && atividadeAtual.slug === quiz.slug
        const estado = concluido
          ? `Concluído: ${nota ?? 0}%`
          : nota === null
            ? 'Pendente'
            : `Melhor nota: ${nota}%`

        return (
          <Box
            key={quiz.id}
            data-testid="atividade"
            id={`quiz-${quiz.slug}`}
            component={RouterLink}
            to={`/cursos/${cursoSlug}/quizzes/${quiz.slug}`}
            onClick={aoNavegar}
            aria-current={atual ? 'page' : undefined}
            className="filter-pill"
            sx={{
              ...grade,
              textDecoration: 'none',
              color: 'inherit',
              background: atual
                ? 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
                : 'transparent',
              '&:hover': { background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' },
            }}
          >
            <span />
            <span style={{ color: 'var(--color-accent)' }}><GlifoDeQuiz /></span>
            <Typography sx={{ fontSize: 15, fontWeight: atual ? 600 : 400, color: concluido ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
              {quiz.titulo}
            </Typography>
            <span style={{ fontSize: 13, color: 'var(--color-text-faint)' }}>{estado}</span>
            <span style={{ color: 'var(--color-accent)' }} aria-label={concluido ? 'Concluído' : undefined}>
              {concluido ? <Tique /> : null}
            </span>
          </Box>
        )
      })}
    </Box>
  )
}
