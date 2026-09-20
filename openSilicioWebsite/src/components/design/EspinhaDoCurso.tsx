import { Box, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import type { CursoComArvore } from '../../types'
import { atividadesDoModulo } from '../../utils/atividadesDeCurso'
import type { UltimaAtividade } from '../../utils/progressoDeCurso'
import BarraDeProgresso from './BarraDeProgresso'
import ListaDeAtividades from './ListaDeAtividades'
import ZerarProgresso from './ZerarProgresso'

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

interface EspinhaDoCursoProps {
  curso: CursoComArvore
  atividadeAtual?: UltimaAtividade
  feitas: number
  total: number
  aulaConcluida: (slug: string) => boolean
  notaDoQuiz: (slug: string) => number | null
  quizConcluido: (slug: string, notaMinima: number) => boolean
  podeZerar: boolean
  aoZerar: () => void
  aoNavegar?: () => void
}

export default function EspinhaDoCurso({
  curso,
  atividadeAtual,
  feitas,
  total,
  aulaConcluida,
  notaDoQuiz,
  quizConcluido,
  podeZerar,
  aoZerar,
  aoNavegar,
}: EspinhaDoCursoProps) {
  const imovel = useReducedMotion() ?? false
  const moduloDaAtual = atividadeAtual
    ? curso.modulos.find((modulo) =>
        atividadesDoModulo(modulo).some(
          (atividade) =>
            atividade.tipo === atividadeAtual.tipo && atividade.slug === atividadeAtual.slug,
        ),
      )?.id
    : undefined
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

  let aulasAnteriores = 0

  return (
    <Box sx={{ pt: '28px', px: { xs: '16px', md: '24px' }, pb: '24px' }}>
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
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap sx={{ mt: 1.25, mb: 1 }}>
        <Typography sx={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
          {feitas} de {total} atividades
        </Typography>
        {podeZerar && <ZerarProgresso aoZerar={aoZerar} />}
      </Stack>

      {curso.modulos.map((modulo, indice) => {
        const numeroInicial = aulasAnteriores + 1
        aulasAnteriores += modulo.aulas.filter((aula) => aula.publicado).length
        const atividades = atividadesDoModulo(modulo)
        const feitasNoModulo = atividades.filter((atividade) =>
          atividade.tipo === 'aula'
            ? aulaConcluida(atividade.slug)
            : quizConcluido(atividade.slug, atividade.nota_minima),
        ).length
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
                minHeight: 44,
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
                {atividades.length === 0 ? 'em breve' : `${feitasNoModulo}/${atividades.length}`}
              </Typography>
            </Box>

            <Box sx={{ mx: '-12px', pb: '10px' }}>
              <ListaDeAtividades
                modulo={modulo}
                cursoSlug={curso.slug}
                numeroInicial={numeroInicial}
                aulaConcluida={aulaConcluida}
                notaDoQuiz={notaDoQuiz}
                quizConcluido={quizConcluido}
                atividadeAtual={atividadeAtual}
                aoNavegar={aoNavegar}
              />
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
