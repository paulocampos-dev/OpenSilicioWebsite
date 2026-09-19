import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'

/**
 * Apagar o progresso de um curso, com a confirmação no lugar do próprio botão.
 *
 * Sem modal e sem window.confirm: o que se perde é o progresso de um curso
 * neste navegador, e uma caixa por cima da página cobraria mais atenção do que
 * isso vale. Quem chama só monta este componente quando há algo gravado para
 * apagar, então o botão nunca aparece sem ter o que fazer.
 */
export default function ZerarProgresso({ aoZerar }: { aoZerar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)

  if (!confirmando) {
    return (
      <Box
        component="button"
        type="button"
        onClick={() => setConfirmando(true)}
        sx={{
          appearance: 'none',
          background: 'transparent',
          border: 0,
          padding: 0,
          font: 'inherit',
          fontSize: 12,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-faint)',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
          cursor: 'pointer',
          '&:hover': { color: 'var(--color-accent)' },
        }}
      >
        Zerar progresso
      </Box>
    )
  }

  return (
    // Largura cheia para a confirmação cair na linha de baixo quando divide a
    // fila com a contagem de aulas, em vez de se espremer ao lado dela.
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Typography sx={{ fontSize: 13, color: 'var(--color-text)' }}>
        Apagar o progresso deste curso?
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <button
          type="button"
          className="btn btn-primary"
          // O botão de abrir some ao confirmar; sem isto o foco do teclado
          // voltaria para o corpo da página.
          autoFocus
          onClick={() => {
            aoZerar()
            setConfirmando(false)
          }}
        >
          Zerar
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setConfirmando(false)}>
          Cancelar
        </button>
      </Stack>
    </Stack>
  )
}
