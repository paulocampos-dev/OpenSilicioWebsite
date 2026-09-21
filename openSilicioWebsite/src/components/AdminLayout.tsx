import { ReactNode, useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Blog', icon: <ArticleIcon />, path: '/admin/blog' },
  { text: 'Educação', icon: <SchoolIcon />, path: '/admin/educacao' },
  { text: 'Cursos', icon: <PlayLessonIcon />, path: '/admin/cursos' },
  { text: 'Wiki', icon: <MenuBookIcon />, path: '/admin/wiki' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const rotaAtiva = (path: string) => (
    path === '/admin' ? location.pathname === path : location.pathname.startsWith(path)
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {mobile && (
            <IconButton
              color="inherit"
              aria-label="Abrir navegação"
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ width: 48, height: 48, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            OpenSilício - Admin
          </Typography>
          {!mobile && (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/"
                startIcon={<HomeIcon />}
                sx={{ mr: 2 }}
              >
                Ver Site
              </Button>
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
              >
                Sair
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant={mobile ? 'temporary' : 'permanent'}
        open={mobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: mobile ? 0 : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: mobile ? 'min(280px, calc(100vw - 48px))' : DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={rotaAtiva(item.path)}
                  aria-current={rotaAtiva(item.path) ? 'page' : undefined}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {mobile && (
            <>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/">
                    <ListItemIcon><HomeIcon /></ListItemIcon>
                    <ListItemText primary="Ver site" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleLogout}>
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Sair" />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          )}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        <Toolbar />
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
