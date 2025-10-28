import { Box, Breadcrumbs, Link as MUILink, Stack, Tab, Tabs, Typography, Alert, Button } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PublishIcon from '@mui/icons-material/Publish'
import { educationApi } from '../services/api'
import type { EducationResource } from '../types'
import LexicalContent from '../components/LexicalContent'
import ShareAndCite from '../components/ShareAndCite'
import { useAuth } from '../contexts/AuthContext'

export default function Recurso() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [resource, setResource] = useState<EducationResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'Visão geral' | 'Conteúdo' | 'Recursos'>('Visão geral')
  const [isPublishing, setIsPublishing] = useState(false)

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

  const handleQuickPublish = async () => {
    if (!resource) return

    setIsPublishing(true)
    try {
      const updated = await educationApi.update(resource.id, { published: true })
      setResource(updated)
      alert('Recurso publicado com sucesso!')
    } catch (error) {
      console.error('Erro ao publicar recurso:', error)
      alert('Erro ao publicar recurso. Tente novamente.')
    } finally {
      setIsPublishing(false)
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

      {isAuthenticated && !resource.published && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<PublishIcon />}
              onClick={handleQuickPublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publicando...' : 'Publicar Agora'}
            </Button>
          }
        >
          <Typography variant="body2" fontWeight={600}>
            Rascunho - Este recurso não está visível publicamente
          </Typography>
        </Alert>
      )}

      <Stack spacing={1}>
        <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} fontWeight={900}>{resource.title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900 }}>{resource.description}</Typography>
      </Stack>

      {resource.category === 'Projetos' ? (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Conteúdo do recurso" variant="scrollable" allowScrollButtonsMobile>
            {(['Visão geral','Conteúdo','Recursos'] as const).map((t) => (
              <Tab key={t} value={t} label={t} />
            ))}
          </Tabs>

          <Stack spacing={3}>
            {tab === 'Visão geral' && (
              <LexicalContent content={resource.overview || ''} />
            )}
            {tab === 'Conteúdo' && (
              <LexicalContent content={resource.content} />
            )}
            {tab === 'Recursos' && (
              <LexicalContent content={resource.resources || ''} />
            )}
          </Stack>
        </>
      ) : (
        <Stack spacing={3}>
          <LexicalContent content={resource.content} />
        </Stack>
      )}

      <ShareAndCite
        title={resource.title}
        author="OpenSilício Team"
        url={`/educacao/${resource.id}`}
        publishedDate={resource.created_at}
      />
    </Stack>
  )
}


