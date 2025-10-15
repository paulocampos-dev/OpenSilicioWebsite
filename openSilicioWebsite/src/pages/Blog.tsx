import { Box, Button, Card, CardActionArea, CardContent, Chip, Grid, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Link as RouterLink } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { blogApi } from '../services/api'
import type { BlogPost } from '../types'

const categories = ['Todos', 'Eletrônica', 'Circuitos Integrados', 'Projeto'] as const

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Todos')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 6

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      // Load all published posts with high limit for client-side filtering
      const response = await blogApi.getAll(true, 1, 100)
      setPosts(response.data)
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts: BlogPost[] = useMemo(() => {
    const matchesCategory = (post: BlogPost) =>
      selectedCategory === 'Todos' || post.category === (selectedCategory as any)
    const matchesQuery = (post: BlogPost) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
      )
    }
    return posts.filter((p) => matchesCategory(p) && matchesQuery(p))
  }, [selectedCategory, searchQuery, posts])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize))
  const pageStartIndex = (currentPage - 1) * pageSize
  const postsOnPage = filteredPosts.slice(pageStartIndex, pageStartIndex + pageSize)

  const categoryList = categories

  const handleChangePage = (newPage: number) => {
    const clampedPage = Math.min(Math.max(1, newPage), totalPages)
    setCurrentPage(clampedPage)
  }

  return (
    <Stack spacing={6}>
      {/* Hero */}
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Typography sx={{ typography: { xs: 'h4', sm: 'h3' } }} fontWeight={800}>
          Blog do OpenSilício
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
          Insights, tutoriais e discussões sobre eletrônica e projeto de circuitos integrados por nossa comunidade.
        </Typography>
      </Stack>

      {/* Search and Filters */}
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <TextField
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          placeholder="Buscar posts..."
          sx={{ width: { xs: '100%', md: 420 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {categoryList.map((category) => (
            <Chip
              key={category}
              label={category}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              onClick={() => {
                setSelectedCategory(category)
                setCurrentPage(1)
              }}
            />
          ))}
        </Stack>
      </Stack>

      {/* Cards Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Carregando posts...</Typography>
            </Box>
          </Grid>
        ) : postsOnPage.length === 0 ? (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Nenhum post encontrado</Typography>
            </Box>
          </Grid>
        ) : (
          postsOnPage.map((post) => (
            <Grid key={post.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={`/blog/${post.slug}`} sx={{ display: 'block' }}>
                  {post.image_url && (
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '16 / 9',
                        backgroundImage: `url(${post.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {post.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {post.excerpt}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Por {post.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ pt: 2 }}>
        <IconButton aria-label="Página anterior" onClick={() => handleChangePage(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeftIcon />
        </IconButton>
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNumber = idx + 1
          const isActive = currentPage === pageNumber
          return (
            <Button
              key={pageNumber}
              onClick={() => handleChangePage(pageNumber)}
              variant={isActive ? 'contained' : 'text'}
              color={isActive ? 'primary' : 'inherit'}
              sx={{
                minWidth: 0,
                width: 40,
                height: 40,
                borderRadius: '50%',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {pageNumber}
            </Button>
          )
        })}
        <IconButton aria-label="Próxima página" onClick={() => handleChangePage(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>
    </Stack>
  )
}


