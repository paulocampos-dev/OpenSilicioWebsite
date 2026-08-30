import { Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFound() {
  return (
    <Box sx={{ textAlign: 'center', py: 12 }}>
      <Stack spacing={3} alignItems="center">
        <Typography variant="h1" fontWeight={900} color="primary.main">404</Typography>
        <Typography variant="h5" fontWeight={700}>Página não encontrada</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          O endereço que você acessou não existe ou foi movido.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" size="large">
          Voltar para o início
        </Button>
      </Stack>
    </Box>
  )
}
