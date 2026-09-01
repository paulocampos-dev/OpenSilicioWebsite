import { Box, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { AulaNaArvore } from '../../types'
import { duracaoPorExtenso } from '../../utils/duracao'

/** Triângulo para aula com vídeo, pauta para aula de leitura. */
function Glifo({ video }: { video: boolean }) {
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

/**
 * As aulas de um módulo, uma por linha.
 *
 * A aula em rascunho vem do backend sem slug, então a união discriminada por
 * `publicado` é o que decide entre uma linha clicável e a linha "em breve": não
 * há como montar um link para o que não tem endereço.
 */
export default function ListaDeAulas({
  aulas,
  cursoSlug,
  numeroInicial,
  concluida,
  aulaAtual,
}: {
  aulas: AulaNaArvore[]
  cursoSlug: string
  /**
   * A numeração corre no curso inteiro e conta só aula publicada, para bater
   * com o "aula 3 de 5" do cabeçalho, que também ignora rascunho. Aula em
   * rascunho sai sem número: ainda não tem lugar na sequência.
   */
  numeroInicial: number
  concluida: (slug: string) => boolean
  aulaAtual?: string
}) {
  let publicadasAntes = 0

  return (
    <Box>
      {aulas.map((aula) => {
        const numero = aula.publicado
          ? String(numeroInicial + publicadasAntes++).padStart(2, '0')
          : ''

        if (!aula.publicado) {
          return (
            <Box key={aula.id} sx={{ ...grade, opacity: 0.55 }}>
              <span />
              <span />
              <Typography sx={{ fontSize: 15, color: 'var(--color-text-muted)' }}>{aula.titulo}</Typography>
              <span style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
                em breve
              </span>
              <span />
            </Box>
          )
        }

        const atual = aula.slug === aulaAtual
        const feita = concluida(aula.slug)

        return (
          <Box
            key={aula.id}
            component={RouterLink}
            to={`/cursos/${cursoSlug}/${aula.slug}`}
            aria-current={atual ? 'page' : undefined}
            className="filter-pill"
            sx={{
              ...grade,
              textDecoration: 'none',
              color: 'inherit',
              background: atual ? 'var(--color-steel-100)' : 'transparent',
              '&:hover': { background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' },
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}>{numero}</span>
            <span style={{ color: aula.tem_video ? 'var(--color-accent)' : 'var(--color-text-faint)' }}>
              <Glifo video={aula.tem_video} />
            </span>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: atual ? 600 : 400,
                color: atual ? 'var(--color-steel-800)' : feita ? 'var(--color-text-muted)' : 'var(--color-text)',
              }}
            >
              {aula.titulo}
            </Typography>
            <span style={{ fontSize: 13, color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}>
              {aula.duracao_seg ? duracaoPorExtenso(aula.duracao_seg) : 'leitura'}
            </span>
            <span style={{ color: 'var(--color-accent)' }} aria-label={feita ? 'Concluída' : undefined}>
              {feita ? <Tique /> : null}
            </span>
          </Box>
        )
      })}
    </Box>
  )
}
