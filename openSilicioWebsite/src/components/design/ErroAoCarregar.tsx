import { Stack, Typography } from '@mui/material'

interface ErroAoCarregarProps {
  /** Refaz a carga da página. */
  aoTentarDeNovo: () => void
}

/**
 * O estado de falha das listagens públicas. Antes elas engoliam o erro e caíam
 * no "nenhum ... encontrado", então uma API fora do ar parecia perda de dados.
 * O "nenhum ... encontrado" continua sendo para resposta vazia de verdade.
 */
export default function ErroAoCarregar({ aoTentarDeNovo }: ErroAoCarregarProps) {
  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
      <Typography sx={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Não foi possível carregar. Tente de novo em alguns minutos.
      </Typography>
      <button type="button" className="btn btn-secondary" onClick={aoTentarDeNovo}>
        Tentar de novo
      </button>
    </Stack>
  )
}
