import { Box, Grid, Stack, Typography } from '@mui/material'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { blogApi, wikiApi } from '../services/api'
import type { BlogPost, WikiLink } from '../types'
import LexicalContent from '../components/LexicalContent'
import ShareAndCite from '../components/ShareAndCite'
import CoverLetterDisplay from '../components/CoverLetterDisplay'
import BlueprintFrame from '../components/design/BlueprintFrame'
import DuotonePhoto from '../components/design/DuotonePhoto'
import DetailPageSkeleton from '../components/design/DetailPageSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'
import useWikiGlossary from '../components/design/useWikiGlossary'
import WikiPopover from '../components/design/WikiPopover'

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [wikiLinks, setWikiLinks] = useState<WikiLink[]>([])
  const { popoverProps, containerHandlers } = useWikiGlossary(wikiLinks)

  useEffect(() => {
    if (slug) {
      loadPost()
    }
  }, [slug])

  const loadPost = async () => {
    try {
      const data = await blogApi.getBySlug(slug!)
      setPost(data)
      wikiApi.getLinks('blog', data.id).then(setWikiLinks).catch(() => {})
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar post:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DetailPageSkeleton />
  }

  if (!post) {
    return (
      <Stack spacing={2}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 28, textTransform: 'uppercase' }}>Post não encontrado</Typography>
        <RouterLink to="/blog">Voltar ao blog</RouterLink>
      </Stack>
    )
  }

  const tocItems = (post.toc_items || []).filter((item) => item.trim())

  return (
    <RevealOnLoad>
    <Stack spacing={4}>
      <Typography sx={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        <RouterLink to="/">Início</RouterLink> / <RouterLink to="/blog">Blog</RouterLink> / {post.title}
      </Typography>

      <Grid container spacing={7} {...containerHandlers}>
        <Grid size={{ xs: 12, md: 8 }}>
          <span className="tag tag-accent">{post.category}</span>
          <Typography component="h1" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: { xs: '38px', md: '60px' }, lineHeight: { xs: '40px', md: '62px' }, letterSpacing: '.01em', textTransform: 'uppercase', marginLeft: 'var(--optical-left)', mt: 2 }}>
            {post.title}
          </Typography>
          <Typography sx={{ fontSize: '15px', mt: 2, color: 'var(--color-text-muted)' }}>
            Por {post.author} · {new Date(post.created_at).toLocaleDateString('pt-BR')}
          </Typography>

          {post.image_url && (
            <Box sx={{ mt: 4 }}>
              <BlueprintFrame duotone frameless>
                <DuotonePhoto src={post.image_url} alt={post.title} label="Capa" aspectRatio="21 / 9" sweepOnLoad />
              </BlueprintFrame>
            </Box>
          )}

          {post.cover_letter && (
            <Box sx={{ mt: 4 }}>
              <CoverLetterDisplay text={post.cover_letter} variant="quote" />
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <LexicalContent content={post.content} />
          </Box>
        </Grid>

        {(tocItems.length > 0 || wikiLinks.length > 0) && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3} sx={{ pt: { md: 7.5 } }}>
              {tocItems.length > 0 && (
                <BlueprintFrame sx={{ p: 2.5 }}>
                  <span className="kicker">Nesta página</span>
                  <Stack spacing={1}>
                    {tocItems.map((item, index) => (
                      <Typography key={index} sx={{ fontSize: '15px', lineHeight: '22px' }}>{item}</Typography>
                    ))}
                  </Stack>
                </BlueprintFrame>
              )}
              {wikiLinks.length > 0 && (
                <BlueprintFrame sx={{ p: 2.5 }}>
                  <span className="kicker">Termos citados</span>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {wikiLinks.map((link) => (
                      <RouterLink key={link.id} to={`/wiki/${link.slug}`} className="tag tag-outline">{link.term}</RouterLink>
                    ))}
                  </Stack>
                </BlueprintFrame>
              )}
            </Stack>
          </Grid>
        )}
      </Grid>

      <ShareAndCite
        title={post.title}
        author={post.author}
        url={`/blog/${post.slug}`}
        imageUrl={post.image_url || ''}
        publishedDate={post.created_at}
      />
      <WikiPopover {...popoverProps} />
    </Stack>
    </RevealOnLoad>
  )
}
