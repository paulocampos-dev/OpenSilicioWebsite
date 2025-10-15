import { Box, Breadcrumbs, Button, Link as MUILink, Stack, Typography } from '@mui/material'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TwitterIcon from '@mui/icons-material/Twitter'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import FacebookIcon from '@mui/icons-material/Facebook'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { blogApi } from '../services/api'
import type { BlogPost } from '../types'
import WikiLinkRenderer from '../components/WikiLinkRenderer'

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
      console.error('Erro ao carregar post:', error)
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
        {post.content_type === 'markdown' ? (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              a: WikiLinkRenderer,
            }}
          >
            {post.content}
          </ReactMarkdown>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        )}
      </Stack>

      <Stack spacing={2} alignItems="center" textAlign="center">
        <Typography variant="subtitle1" fontWeight={700}>Compartilhar este post</Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button variant="outlined" startIcon={<TwitterIcon />} onClick={() => console.log('share twitter (mock)')}>
            Twitter
          </Button>
          <Button variant="outlined" startIcon={<LinkedInIcon />} onClick={() => console.log('share linkedin (mock)')}>
            LinkedIn
          </Button>
          <Button variant="outlined" startIcon={<FacebookIcon />} onClick={() => console.log('share facebook (mock)')}>
            Facebook
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}


