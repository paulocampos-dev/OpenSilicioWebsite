import { Box } from '@mui/material'
import type { CorrecaoDoQuiz } from '../../utils/correcaoDeQuiz'

interface IndiceDoQuizProps {
  questoes: Array<{ id: string }>
  atual: number
  respondidas: ReadonlySet<string>
  correcao: CorrecaoDoQuiz | null
  aoSelecionar: (indice: number) => void
}

export default function IndiceDoQuiz({
  questoes,
  atual,
  respondidas,
  correcao,
  aoSelecionar,
}: IndiceDoQuizProps) {
  return (
    <Box
      aria-label="Questões do quiz"
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        pb: 1,
        scrollbarWidth: 'thin',
      }}
    >
      {questoes.map((questao, indice) => {
        const resultado = correcao?.porQuestao.find((item) => item.questaoId === questao.id)
        const estado = resultado
          ? resultado.correta
            ? 'correta'
            : 'incorreta'
          : respondidas.has(questao.id)
            ? 'respondida'
            : 'sem resposta'

        return (
          <button
            key={questao.id}
            type="button"
            className="btn btn-secondary"
            aria-current={indice === atual ? 'step' : undefined}
            aria-label={`Questão ${indice + 1}, ${estado}`}
            onClick={() => aoSelecionar(indice)}
            style={{
              minWidth: 44,
              paddingInline: 0,
              borderColor:
                indice === atual || resultado?.correta
                  ? 'var(--color-accent)'
                  : resultado && !resultado.correta
                    ? 'var(--color-error, #b42318)'
                    : undefined,
              color: indice === atual ? 'var(--color-accent)' : undefined,
            }}
          >
            {resultado ? (resultado.correta ? '✓' : '×') : indice + 1}
          </button>
        )
      })}
    </Box>
  )
}
