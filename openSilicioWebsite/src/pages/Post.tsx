import { Box, Breadcrumbs, Link as MUILink, Stack, Typography, Alert, Button } from '@mui/material'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PublishIcon from '@mui/icons-material/Publish'
import { blogApi } from '../services/api'
import type { BlogPost } from '../types'
import LexicalContent from '../components/LexicalContent'
import ShareAndCite from '../components/ShareAndCite'
import { useAuth } from '../contexts/AuthContext'

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuth()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (slug) {
      loadPost()
    }
  }, [slug])

  const loadPost = async () => {
    try {
      const data = await blogApi.getBySlug(slug!)
      setPost(data)
    } catch (error) {
      console.error('Erro ao carregar post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPublish = async () => {
    if (!post) return

    setIsPublishing(true)
    try {
      const updated = await blogApi.update(post.id, { published: true })
      setPost(updated)
      alert('Post publicado com sucesso!')
    } catch (error) {
      console.error('Erro ao publicar post:', error)
      alert('Erro ao publicar post. Tente novamente.')
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

  if (!post) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={800}>Post não encontrado</Typography>
        <MUILink component={RouterLink} to="/blog">Voltar ao blog</MUILink>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink component={RouterLink} to="/blog" underline="hover">Blog</MUILink>
          <Typography color="text.secondary">{post.title}</Typography>
        </Breadcrumbs>

        {isAuthenticated && !post.published && (
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
              Rascunho - Este post não está visível publicamente
            </Typography>
          </Alert>
        )}

        <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} fontWeight={800}>
          {post.title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Por {post.author} • {new Date(post.created_at).toLocaleDateString('pt-BR')}
        </Typography>
      </Stack>

      {post.image_url && (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 2,
            backgroundImage: `url(${post.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <Stack spacing={2} sx={{ maxWidth: '100%' }}>
        <LexicalContent content={post.content} />
      </Stack>

      <ShareAndCite
        title={post.title}
        author={post.author}
        url={`/blog/${post.slug}`}
        imageUrl={post.image_url}
        publishedDate={post.created_at}
      />
    </Stack>
  )
}


