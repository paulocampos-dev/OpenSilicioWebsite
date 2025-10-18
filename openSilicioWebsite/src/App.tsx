import { useMemo, useState } from 'react'
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, IconButton, Box, Container, Button } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { BrowserRouter, Routes, Route, Link as RouterLink, useLocation } from 'react-router-dom'
import { getTheme, type ColorMode } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'

// Public Pages
import Landing from './pages/Landing'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Educacao from './pages/Educacao'
import Recurso from './pages/Recurso'
import WikiPage from './pages/WikiPage'
import Wiki from './pages/Wiki'
import About from './pages/About'
import Login from './pages/Login'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import BlogList from './pages/admin/BlogList'
import BlogForm from './pages/admin/BlogForm'
import EducationList from './pages/admin/EducationList'
import EducationForm from './pages/admin/EducationForm'
import WikiList from './pages/admin/WikiList'
import WikiForm from './pages/admin/WikiForm'
import Settings from './pages/admin/Settings'

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
  const [mode, setMode] = useState<ColorMode>('light')
  const theme = useMemo(() => getTheme(mode), [mode])
  const toggleMode = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'))
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

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
              <Route path="/wiki" element={<Container sx={{ py: 4 }}><WikiPage /></Container>} />
              <Route path="/wiki/:slug" element={<Container sx={{ py: 4 }}><Wiki /></Container>} />
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
                    <WikiList />
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


