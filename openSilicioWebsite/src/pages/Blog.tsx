import { Box, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { blogApi } from '../services/api'
import type { BlogPost } from '../types'
import DuotonePhoto from '../components/design/DuotonePhoto'
import CardGridSkeleton from '../components/design/CardGridSkeleton'
import RevealOnLoad from '../components/design/RevealOnLoad'

const MotionGridItem = motion.create(Grid)

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [currentPage, setCurrentPage] = useState<number>(1)
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

  const filteredPosts: BlogPost[] = useMemo(() => {
    const matchesCategory = (post: BlogPost) =>
      selectedCategory === 'Todos' || post.category === selectedCategory
    const matchesQuery = (post: BlogPost) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
    }
    return posts.filter((p) => matchesCategory(p) && matchesQuery(p))
  }, [selectedCategory, searchQuery, posts])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize))
  const pageStartIndex = (currentPage - 1) * pageSize
  const postsOnPage = filteredPosts.slice(pageStartIndex, pageStartIndex + pageSize)

  const handleChangePage = (newPage: number) => {
    setCurrentPage(Math.min(Math.max(1, newPage), totalPages))
  }

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
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          style={{ maxWidth: 420 }}
        />
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => { setSelectedCategory(category); setCurrentPage(1) }}
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
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
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

      {!loading && filteredPosts.length > 0 && (
        <Stack direction="row" spacing={1} justifyContent="center">
          <button type="button" className="btn btn-secondary" disabled={currentPage === 1} onClick={() => handleChangePage(currentPage - 1)}>←</button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNumber = idx + 1
            return (
              <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => handleChangePage(pageNumber)}>
                {pageNumber}
              </button>
            )
          })}
          <button type="button" className="btn btn-secondary" disabled={currentPage === totalPages} onClick={() => handleChangePage(currentPage + 1)}>→</button>
        </Stack>
      )}
    </Stack>
  )
}
