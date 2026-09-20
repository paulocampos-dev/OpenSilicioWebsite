import { Box, Stack, Typography } from '@mui/material'
import type { Ref } from 'react'
import type { QuizQuestao } from '../../types'
import type { CorrecaoDoQuiz } from '../../utils/correcaoDeQuiz'

interface QuestaoDoQuizProps {
  questao: QuizQuestao
  numero: number
  resposta: string | undefined
  correcao: CorrecaoDoQuiz['porQuestao'][number] | null
  tituloRef: Ref<HTMLHeadingElement>
  aoResponder: (alternativaId: string) => void
}

export default function QuestaoDoQuiz({
  questao,
  numero,
  resposta,
  correcao,
  tituloRef,
  aoResponder,
}: QuestaoDoQuizProps) {
  const alternativaCorreta = questao.alternativas.find(
    (alternativa) => alternativa.id === correcao?.alternativaCorretaId,
  )

  return (
    <Box
      component="fieldset"
      sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}
      disabled={correcao !== null}
    >
      <Box
        component="legend"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Questão {numero}
      </Box>
      <Typography
        ref={tituloRef}
        component="h2"
        tabIndex={-1}
        sx={{
          p: 0,
          mb: 3,
          fontFamily: 'var(--font-heading)',
          fontSize: { xs: 28, md: 36 },
          lineHeight: 1.08,
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        <Box component="span" aria-hidden="true" sx={{ color: 'var(--color-accent)', mr: 1 }}>
          {String(numero).padStart(2, '0')}
        </Box>
        {questao.enunciado}
      </Typography>

      <Stack spacing={1.25}>
        {questao.alternativas.map((alternativa) => {
          const escolhida = resposta === alternativa.id
          const correta = correcao?.alternativaCorretaId === alternativa.id
          const incorretaEscolhida = correcao !== null && escolhida && !correta
          return (
            <Box
              component="label"
              key={alternativa.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr auto',
                gap: 1.5,
                alignItems: 'start',
                p: 2,
                border: '1px solid',
                borderColor: correta
                  ? 'var(--color-accent)'
                  : incorretaEscolhida
                    ? 'var(--color-error, #b42318)'
                    : escolhida
                      ? 'var(--color-accent)'
                      : 'var(--color-line)',
                background: escolhida ? 'var(--color-surface-subtle)' : 'transparent',
                cursor: correcao ? 'default' : 'pointer',
                color: 'var(--color-text)',
                '&:focus-within': { outline: '2px solid var(--color-accent)', outlineOffset: 2 },
              }}
            >
              <input
                type="radio"
                name={`questao-${questao.id}`}
                value={alternativa.id}
                checked={escolhida}
                onChange={() => aoResponder(alternativa.id)}
                style={{ margin: '3px 0 0', accentColor: 'var(--color-accent)' }}
              />
              <Typography sx={{ fontSize: 17, lineHeight: 1.45 }}>{alternativa.texto}</Typography>
              {correta && <span aria-label="Resposta correta">✓</span>}
              {incorretaEscolhida && <span aria-label="Resposta incorreta">×</span>}
            </Box>
          )
        })}
      </Stack>

      {correcao && (
        <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid var(--color-line)' }}>
          <Typography sx={{ fontWeight: 600, color: correcao.correta ? 'var(--color-accent)' : 'var(--color-text)' }}>
            {correcao.correta
              ? 'Resposta correta.'
              : `Resposta correta: ${alternativaCorreta?.texto ?? 'não informada'}`}
          </Typography>
          <Typography sx={{ mt: 1, color: 'var(--color-text-muted)', lineHeight: 1.65 }}>
            {questao.explicacao}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
