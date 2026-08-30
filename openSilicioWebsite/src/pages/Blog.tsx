import { Box, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { blogApi } from '../services/api'
import type { BlogPost } from '../types'
import DuotonePhoto from '../components/design/DuotonePhoto'
import CardGridSkeleton from '../components/design/CardGridSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'
import Pager from '../components/design/Pager'
import { usePagedFilter } from '../components/design/usePagedFilter'

const MotionGridItem = motion.create(Grid)

export default function Blog() {
  const reduce = useReducedMotion()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>(['Todos'])
  const [loading, setLoading] = useState(true)
  const pageSize = 6

  useEffect(() => {
    loadPosts()
    loadCategories()
  }, [])

  const loadPosts = async () => {
    try {
      // Load all published posts with high limit for client-side filtering
      const response = await blogApi.getAll(true, 1, 100)
      setPosts(response.data)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar posts:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await blogApi.getCategories()
      setCategories(['Todos', ...data])
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao carregar categorias:', error)
      }
    }
  }

  const { pageItems: postsOnPage, filteredCount, page, totalPages, setPage } = usePagedFilter(posts, {
    pageSize,
    filterFn: (post) => {
      const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory
      const q = searchQuery.trim().toLowerCase()
      const matchesQuery = !q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    },
    deps: [selectedCategory, searchQuery],
  })

  return (
    <Stack spacing={5}>
      <Stack spacing={1.5}>
        <Typography component="h2" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: { xs: '40px', md: '56px' }, lineHeight: { xs: '42px', md: '58px' }, letterSpacing: '.01em', textTransform: 'uppercase', marginLeft: 'var(--optical-left)' }}>
          Blog do OpenSilício
        </Typography>
        <Typography sx={{ fontSize: '17px', lineHeight: '26px', maxWidth: '64ch', color: 'var(--color-text-muted)' }}>
          Insights, tutoriais e discussões sobre eletrônica e projeto de circuitos integrados por nossa comunidade.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <input
          className="input"
          type="search"
          placeholder="Buscar posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? 'tag filter-pill' : 'tag tag-outline filter-pill'}
              style={selectedCategory === category ? { background: 'var(--color-accent)', color: 'var(--brand-paper)', border: '1px solid var(--color-accent)', cursor: 'pointer' } : { cursor: 'pointer' }}
            >
              {category}
            </button>
          ))}
        </Stack>
      </Stack>

      {loading ? (
        <CardGridSkeleton count={6} columns={{ xs: 12, sm: 6, lg: 4 }} />
      ) : postsOnPage.length === 0 ? (
        <Typography sx={{ textAlign: 'center', py: 4 }}>Nenhum post encontrado</Typography>
      ) : (
        <RevealOnLoad>
          <Grid container spacing={4}>
            <AnimatePresence>
              {postsOnPage.map((post) => (
                <MotionGridItem
                  key={post.id}
                  size={{ xs: 12, sm: 6, lg: 4 }}
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <RouterLink to={`/blog/${post.slug}`} className="card blueprint" style={{ padding: 0, textDecoration: 'none', color: 'inherit', gap: 0, display: 'flex', flexDirection: 'column' }}>
                    {post.image_url && (
                      <DuotonePhoto src={post.image_url} alt={post.title} label={post.category} sx={{ borderBottom: '1px solid var(--color-line)' }} />
                    )}
                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span className="kicker" style={{ margin: 0 }}>{post.category}</span>
                      <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '22px', lineHeight: '24px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                        {post.title}
                      </Typography>
                      <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>{post.excerpt}</Typography>
                      <Typography sx={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>
                        Por {post.author} · {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </RouterLink>
                </MotionGridItem>
              ))}
            </AnimatePresence>
          </Grid>
        </RevealOnLoad>
      )}

      {!loading && filteredCount > 0 && (
        <Pager page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </Stack>
  )
}
