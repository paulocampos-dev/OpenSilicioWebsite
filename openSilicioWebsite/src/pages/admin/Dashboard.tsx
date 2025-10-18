import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Blog',
      description: 'Gerenciar posts do blog',
      icon: <ArticleIcon sx={{ fontSize: 48 }} />,
      path: '/admin/blog',
      createPath: '/admin/blog/new',
    },
    {
      title: 'Educação',
      description: 'Gerenciar recursos educacionais',
      icon: <SchoolIcon sx={{ fontSize: 48 }} />,
      path: '/admin/educacao',
      createPath: '/admin/educacao/new',
    },
    {
      title: 'Wiki',
      description: 'Gerenciar entradas da wiki',
      icon: <MenuBookIcon sx={{ fontSize: 48 }} />,
      path: '/admin/wiki',
      createPath: '/admin/wiki/new',
    },
    {
      title: 'Configurações',
      description: 'Gerenciar configurações do site',
      icon: <SettingsIcon sx={{ fontSize: 48 }} />,
      path: '/admin/configuracoes',
      createPath: null,
    },
  ];

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Painel Administrativo
        </Typography>
        <Typography color="text.secondary">
          Bem-vindo, {user?.username}! Gerencie o conteúdo do OpenSilício.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid key={section.title} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2} alignItems="center" textAlign="center">
                  <Box color="primary.main">{section.icon}</Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {section.description}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {section.createPath ? (
                      <>
                        <Button
                          component={RouterLink}
                          to={section.path}
                          variant="outlined"
                          size="small"
                        >
                          Ver Todos
                        </Button>
                        <Button
                          component={RouterLink}
                          to={section.createPath}
                          variant="contained"
                          size="small"
                        >
                          Criar Novo
                        </Button>
                      </>
                    ) : (
                      <Button
                        component={RouterLink}
                        to={section.path}
                        variant="contained"
                        size="small"
                        fullWidth
                      >
                        Acessar
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

