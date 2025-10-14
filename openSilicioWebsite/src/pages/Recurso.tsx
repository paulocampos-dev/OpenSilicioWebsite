import { Box, Breadcrumbs, Button, Link as MUILink, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { educationApi } from '../services/api'
import type { EducationResource } from '../types'

export default function Recurso() {
  const { id } = useParams<{ id: string }>()
  const [resource, setResource] = useState<EducationResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'Visão geral' | 'Conteúdo' | 'Recursos'>('Conteúdo')

  useEffect(() => {
    if (id) {
      loadResource()
    }
  }, [id])

  const loadResource = async () => {
    try {
      const data = await educationApi.getById(id!)
      setResource(data)
    } catch (error) {
      console.error('Erro ao carregar recurso:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  if (!resource) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>Recurso não encontrado</Typography>
        <MUILink component={RouterLink} to="/educacao">Voltar à Educação</MUILink>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <Breadcrumbs aria-label="breadcrumb">
        <MUILink component={RouterLink} to="/educacao" underline="hover">Educação</MUILink>
        <Typography color="text.secondary">{resource.title}</Typography>
      </Breadcrumbs>

      <Stack spacing={1}>
        <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} fontWeight={900}>{resource.title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900 }}>{resource.description}</Typography>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Conteúdo do recurso" variant="scrollable" allowScrollButtonsMobile>
        {(['Visão geral','Conteúdo','Recursos'] as const).map((t) => (
          <Tab key={t} value={t} label={t} />
        ))}
      </Tabs>

      <Stack spacing={3}>
        {resource.content_type === 'markdown' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{resource.content}</ReactMarkdown>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: resource.content }} />
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="contained" fullWidth>Marcar como concluído</Button>
        <Button variant="outlined" fullWidth>Baixar recursos</Button>
      </Stack>
    </Stack>
  )
}


