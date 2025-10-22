import { useMemo, useState, useEffect } from 'react'
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, IconButton, Box, Container, Button } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { BrowserRouter, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom'
import { getTheme, type ColorMode } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import Footer from './components/Footer'

// Public Pages
import Landing from './pages/Landing'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Educacao from './pages/Educacao'
import Recurso from './pages/Recurso'
import WikiList from './pages/WikiList'
import WikiDetail from './pages/WikiDetail'
import About from './pages/About'
import Login from './pages/Login'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import BlogList from './pages/admin/BlogList'
import BlogForm from './pages/admin/BlogForm'
import EducationList from './pages/admin/EducationList'
import EducationForm from './pages/admin/EducationForm'
import AdminWikiList from './pages/admin/WikiList'
import WikiForm from './pages/admin/WikiForm'
import Settings from './pages/admin/Settings'

// localStorage key for theme preference
const THEME_STORAGE_KEY = 'opensilicio-theme-mode'

// Get initial theme mode from localStorage or system preference
const getInitialMode = (): ColorMode => {
  try {
    // First, check localStorage for saved preference
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode
    }

    // If no saved preference, check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch (error) {
    // If localStorage is not available (e.g., private browsing), fall back to system or light
    console.warn('localStorage not available:', error)
  }

  // Default to light mode
  return 'light'
}

// Save theme mode to localStorage
const saveMode = (mode: ColorMode): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}

function Header({ mode, toggleMode }: { mode: ColorMode; toggleMode: () => void }) {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  if (isAdminRoute) {
    return null
  }

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ gap: 2, minHeight: 80 }}>
        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <Box component="img" src="/open-silicio-logo.jpg" alt="OpenSilício" sx={{ width: 56, height: 56, mr: 1, borderRadius: 1 }} />
          <Typography variant="h5" fontWeight={700}>OpenSilício</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button component={RouterLink} to="/" color="primary">Início</Button>
        <Button component={RouterLink} to="/educacao" color="primary">Educação</Button>
        <Button component={RouterLink} to="/blog" color="primary">Blog</Button>
        <Button component={RouterLink} to="/wiki" color="primary">Wiki</Button>
        <Button component={RouterLink} to="/sobre" color="primary">Sobre</Button>
        <Button component={RouterLink} to="/login" color="primary">Entrar</Button>
        <IconButton onClick={toggleMode} color="inherit" aria-label="Alternar tema" size="large">
          {mode === 'dark' ? <Brightness7Icon fontSize="large" /> : <Brightness4Icon fontSize="large" />}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

function AppContent() {
  const [mode, setMode] = useState<ColorMode>(getInitialMode)
  const theme = useMemo(() => getTheme(mode), [mode])
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    saveMode(mode)
  }, [mode])

  // Listen for system preference changes (optional enhancement)
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't explicitly set a preference
        const savedMode = localStorage.getItem(THEME_STORAGE_KEY)
        if (!savedMode) {
          setMode(e.matches ? 'dark' : 'light')
        }
      }

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
      // Legacy browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    } catch (error) {
      console.warn('Could not set up system theme listener:', error)
    }
  }, [])

  // Toggle between light and dark mode
  const toggleMode = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Header mode={mode} toggleMode={toggleMode} />
        <Box sx={{ flex: 1 }}>
          {!isAdminRoute && (
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/blog" element={<Container sx={{ py: 4 }}><Blog /></Container>} />
              <Route path="/blog/:slug" element={<Container sx={{ py: 4 }}><Post /></Container>} />
              <Route path="/educacao" element={<Container sx={{ py: 4 }}><Educacao /></Container>} />
              <Route path="/educacao/:id" element={<Container sx={{ py: 4 }}><Recurso /></Container>} />
              <Route path="/wiki" element={<Container sx={{ py: 4 }}><WikiList /></Container>} />
              <Route path="/wiki/:slug" element={<Container sx={{ py: 4 }}><WikiDetail /></Container>} />
              <Route path="/sobre" element={<Container sx={{ py: 4 }}><About /></Container>} />
              <Route path="/login" element={<Container sx={{ py: 4 }}><Login /></Container>} />
            </Routes>
          )}
          {isAdminRoute && (
            <Routes>
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/blog" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/blog/new" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/blog/edit/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/educacao" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EducationList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/educacao/new" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EducationForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/educacao/edit/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <EducationForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/wiki" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminWikiList />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/wiki/new" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <WikiForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/wiki/edit/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <WikiForm />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/configuracoes" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Routes>
          )}
        </Box>
        {!isAdminRoute && <Footer />}
      </Box>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}


