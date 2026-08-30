import { useMemo, useState, useEffect } from 'react'
import { ThemeProvider, CssBaseline, Box, Container, Drawer, Stack, useMediaQuery, useTheme } from '@mui/material'
import { BrowserRouter, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom'
import { useScroll, useMotionValueEvent } from 'framer-motion'
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
import NotFound from './pages/NotFound'

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

// Inline Lucide-style icons (stroke-width 1.5) — the system's icon rules
// call for these directly rather than a filled icon-font set.
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" />
    </svg>
  )
}
function MenuGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function Header({ mode, toggleMode }: { mode: ColorMode; toggleMode: () => void }) {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (latest) => setCondensed(latest > 48))
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) {
    return null
  }

  const closeDrawer = () => setDrawerOpen(false)

  const menuItems = [
    { label: 'Início', path: '/' },
    { label: 'Educação', path: '/educacao' },
    { label: 'Blog', path: '/blog' },
    { label: 'Wiki', path: '/wiki' },
    { label: 'Sobre', path: '/sobre' },
  ]

  const isCurrent = (path: string) => location.pathname === path
  const logo = mode === 'dark' ? '/logo-mark-white.png' : '/logo-mark-steel.png'

  return (
    <Box
      component="header"
      className={[mode === 'dark' ? 'field' : undefined, 'nav-sticky', condensed ? 'nav-condensed' : undefined].filter(Boolean).join(' ')}
      sx={{ zIndex: (t) => t.zIndex.appBar }}
    >

      <nav className="nav" style={{ justifyContent: 'space-between' }}>
        <RouterLink to="/" className="nav-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <img className="nav-brand__mark" src={logo} alt="" />
          <span className="nav-brand__name">OpenSilício</span>
        </RouterLink>

        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {menuItems.map((item) => (
              <RouterLink key={item.path} to={item.path} aria-current={isCurrent(item.path) ? 'page' : undefined}>
                {item.label}
              </RouterLink>
            ))}
            <button type="button" className="btn btn-secondary btn-icon" onClick={toggleMode} aria-label="Alternar tema escuro">
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </Box>
        )}

        {isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <button type="button" className="btn btn-secondary btn-icon" onClick={toggleMode} aria-label="Alternar tema escuro">
              {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button type="button" className="btn btn-secondary btn-icon" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
              <MenuGlyph />
            </button>
          </Box>
        )}
      </nav>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer} PaperProps={{ sx: { width: 280, p: 3, borderRadius: 0 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <span className="kicker" style={{ margin: 0 }}>Navegação</span>
          <button type="button" className="btn btn-secondary btn-icon" onClick={closeDrawer} aria-label="Fechar menu">
            <CloseGlyph />
          </button>
        </Stack>
        <Stack>
          {menuItems.map((item) => (
            <RouterLink
              key={item.path}
              to={item.path}
              onClick={closeDrawer}
              style={{
                padding: '10px 0',
                borderTop: '1px solid var(--color-line)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 20,
                letterSpacing: '.02em',
                textTransform: 'uppercase',
                color: isCurrent(item.path) ? 'var(--color-accent)' : 'var(--color-text)',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </RouterLink>
          ))}
        </Stack>
      </Drawer>
    </Box>
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

  // Drive the plain-CSS design tokens (independent of MUI's theme) from the
  // same mode — see tokens/colors.css's [data-color-mode="dark"] overrides.
  useEffect(() => {
    document.documentElement.dataset.colorMode = mode
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
              <Route path="*" element={<Container sx={{ py: 4 }}><NotFound /></Container>} />
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


