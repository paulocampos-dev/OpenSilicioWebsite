import { Box, Breadcrumbs, Link as MUILink, Stack, Typography } from '@mui/material'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { blogApi } from '../services/api'
import type { BlogPost } from '../types'
import LexicalContent from '../components/LexicalContent'
import ShareAndCite from '../components/ShareAndCite'

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

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
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar post:', error)
      }
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


