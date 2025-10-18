import { Box, Button, Container, Grid, Paper, Stack, Typography, Card, CardContent, Avatar } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import SchoolIcon from '@mui/icons-material/School'
import ArticleIcon from '@mui/icons-material/Article'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CodeIcon from '@mui/icons-material/Code'
import GroupsIcon from '@mui/icons-material/Groups'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <Stack sx={{ m: 0, p: 0 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '85vh', md: '90vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'visible',
          width: '100vw',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100%',
            backgroundImage: 'url(/chip_closeup_stock.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100%',
            background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.2) 0%, transparent 50%)',
            zIndex: 2,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
          <Stack spacing={6} alignItems="center" textAlign="center" sx={{ py: { xs: 4, md: 8 } }}>
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                px: 3,
                py: 1,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: 'white',
                  letterSpacing: 2,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Grupo de Pesquisa e Extensão - Poli USP
              </Typography>
            </Box>

            <Typography
              sx={{
                typography: { xs: 'h3', sm: 'h2', md: 'h1' },
                color: 'common.white',
                fontWeight: 800,
                maxWidth: 1000,
                lineHeight: 1.1,
                textShadow: '0 4px 24px rgba(0,0,0,0.3)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 50%, #e8ecff 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Democratizando o Design de Chips
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                maxWidth: 700,
                fontWeight: 400,
                lineHeight: 1.7,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
              }}
            >
              Formamos a próxima geração de projetistas de circuitos integrados através de educação aberta, projetos práticos e colaboração.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 4 }}>
              <Button
                component={RouterLink}
                to="/educacao"
                variant="contained"
                size="large"
                startIcon={<RocketLaunchIcon />}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
                aria-label="Ir para Educação"
              >
                Começar a Aprender
              </Button>
              <Button
                component={RouterLink}
                to="/wiki"
                variant="outlined"
                size="large"
                startIcon={<MenuBookIcon />}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 32px rgba(255,255,255,0.1)',
                  },
                }}
                aria-label="Explorar Wiki"
              >
                Explorar Wiki
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* --- Spacer before Quick Start Section --- */}
      <Box sx={{ py: { xs: 2, md: 3 } }} />

      {/* Quick Start Section */}
      <Box
        sx={{
          mt: { xs: 0, md: 0 }, // Remove negative margin for more natural flow
          mb: { xs: 0, md: 0 }, // Remove tight bottom margin
          py: { xs: 4, md: 6 },
          background: (theme) => theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center" textAlign="center" sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
              }}
            >
              Acesso Rápido
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                maxWidth: 650,
                fontSize: { xs: '1.6rem', md: '2.1rem' },
                lineHeight: 1.2,
              }}
            >
              Comece sua jornada em microeletrônica em poucos cliques
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 540,
                fontSize: '1.08rem',
                lineHeight: 1.65,
                fontWeight: 400,
              }}
            >
              Veja como você pode iniciar seu aprendizado, pesquisar informações ou se atualizar rapidamente:
            </Typography>
          </Stack>
          <Grid container spacing={5} justifyContent="center">
            {[
              {
                icon: <SchoolIcon sx={{ fontSize: 32 }} />,
                title: 'Trilha de Aprendizado',
                description: 'Siga um caminho guiado e comece pela base certa.',
                link: '/educacao',
                aria: 'Abrir trilhas de educação',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
              {
                icon: <MenuBookIcon sx={{ fontSize: 32 }} />,
                title: 'Explorar Wiki',
                description: 'Busque termos e conceitos essenciais rapidamente.',
                link: '/wiki',
                aria: 'Explorar a Wiki técnica',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              },
              {
                icon: <ArticleIcon sx={{ fontSize: 32 }} />,
                title: 'Ler o Blog',
                description: 'Tutoriais e novidades do ecossistema de microeletrônica.',
                link: '/blog',
                aria: 'Ir para o blog',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              },
            ].map((action, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card
                  component={RouterLink}
                  to={action.link}
                  aria-label={action.aria}
                  sx={{
                    width: 260,
                    height: '100%',
                    textDecoration: 'none',
                    background: (theme) => theme.palette.background.paper,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    backdropFilter: 'blur(18px)',
                    borderRadius: 4,
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0,0,0,0.3)'
                      : '0 8px 32px rgba(0,0,0,0.10)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: action.gradient,
                      opacity: 0.86,
                      transition: 'opacity 0.3s',
                    },
                    '&:hover': {
                      transform: 'translateY(-10px) scale(1.03)',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 20px 60px rgba(0,0,0,0.4)'
                        : '0 20px 60px rgba(0,0,0,0.18)',
                      '&::before': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 5 }}>
                    <Stack spacing={3} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 70,
                          height: 70,
                          background: action.gradient,
                          color: 'common.white',
                          boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            color: 'text.primary',
                            mb: 1.1,
                            fontSize: '1.23rem'
                          }}
                        >
                          {action.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.7,
                            fontSize: '0.95rem'
                          }}
                        >
                          {action.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={8} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }} >
            <Box
              sx={{
                width: '100%',
                height: { xs: 320, md: 480 },
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  zIndex: 1,
                },
                '& img': {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease',
                },
                '&:hover img': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Box component="img"
              src="/boardPCB_stocl.jpg"
              alt="Circuit board design"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={4}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    letterSpacing: 2,
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Sobre o OpenSilício
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  color: 'text.primary',
                }}
              >
                Tornando a Microeletrônica Acessível
              </Typography>
              <Stack spacing={3}>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                    fontWeight: 400,
                  }}
                >
                  Somos o OpenSilício, um grupo de pesquisa e extensão da Escola Politécnica da USP.
                  Nossa missão é democratizar o desenvolvimento de microeletrônica através de educação
                  aberta e colaboração.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                    fontWeight: 400,
                  }}
                >
                  Unimos ensino, pesquisa e projetos práticos para formar profissionais capacitados
                  em design de circuitos integrados, preparando-os para os desafios da indústria moderna.
                </Typography>
              </Stack>
              <Box sx={{ pt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/blog"
                  variant="contained"
                  size="large"
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Conheça Nossa História
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box
        sx={{ py: { xs: 10, md: 16 } }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={8}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Typography
                variant="overline"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontSize: '0.875rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                O que oferecemos
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  maxWidth: 700,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  color: 'text.primary',
                }}
              >
                Recursos Completos para Sua Jornada
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  maxWidth: 600,
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}
              >
                Do básico ao avançado, oferecemos todo o suporte necessário para você se tornar
                um expert em design de chips.
              </Typography>
            </Stack>

            <Grid container spacing={4}>
              {[
                {
                  icon: <SchoolIcon sx={{ fontSize: 42 }} />,
                  title: 'Educação Estruturada',
                  description: 'Cursos, workshops e trilhas de aprendizado organizadas para todos os níveis, do iniciante ao avançado.',
                  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  link: '/educacao',
                },
                {
                  icon: <ArticleIcon sx={{ fontSize: 42 }} />,
                  title: 'Blog Técnico',
                  description: 'Tutoriais, análises e insights sobre as últimas tendências em microeletrônica e design de chips.',
                  gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  link: '/blog',
                },
                {
                  icon: <MenuBookIcon sx={{ fontSize: 42 }} />,
                  title: 'Wiki Técnica',
                  description: 'Dicionário completo com termos, conceitos e definições essenciais da área de microeletrônica.',
                  gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  link: '/wiki',
                },
                {
                  icon: <CodeIcon sx={{ fontSize: 42 }} />,
                  title: 'Projetos Open Source',
                  description: 'Acesso a projetos reais de circuitos integrados desenvolvidos de forma colaborativa e aberta.',
                  gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  link: '/blog',
                },
                {
                  icon: <GroupsIcon sx={{ fontSize: 42 }} />,
                  title: 'Comunidade Ativa',
                  description: 'Conecte-se com estudantes, pesquisadores e profissionais da indústria através de nossa rede.',
                  gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  link: '/blog',
                },
                {
                  icon: <RocketLaunchIcon sx={{ fontSize: 42 }} />,
                  title: 'Eventos e Workshops',
                  description: 'Participe de eventos, palestras e workshops com especialistas da academia e indústria.',
                  gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  link: '/educacao',
                },
              ].map((feature, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                  <Card
                    component={RouterLink}
                    to={feature.link}
                    aria-label={`Abrir: ${feature.title}`}
                    sx={{
                      height: '100%',
                      textDecoration: 'none',
                      background: (theme) => theme.palette.background.paper,
                      backdropFilter: 'blur(20px)',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 4,
                      boxShadow: (theme) => theme.palette.mode === 'dark' 
                        ? '0 8px 32px rgba(0,0,0,0.3)' 
                        : '0 8px 32px rgba(0,0,0,0.08)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: feature.gradient,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                          ? '0 20px 60px rgba(0,0,0,0.4)'
                          : '0 20px 60px rgba(0,0,0,0.15)',
                        '&::before': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <CardContent sx={{ p: 5 }}>
                      <Stack spacing={3}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            background: feature.gradient,
                            color: 'common.white',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              fontSize: '1.25rem',
                              mb: 2,
                              color: 'text.primary',
                            }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              lineHeight: 1.7,
                              fontSize: '0.95rem',
                              fontWeight: 400,
                            }}
                          >
                            {feature.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          my: { xs: 6, md: 10 },
          width: '100%',
        }}
      />

      {/* Partners / Social Proof */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                letterSpacing: 2,
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
              }}
            >
              Apoiadores e Parceiros
            </Typography>
            <Grid container spacing={6} alignItems="center" justifyContent="center">
              {[ '/amigos-da-poli-logo-removebg-preview.png'  ].map((src, i) => (
                <Grid key={i}>
                  <Box
                    component="img"
                    src={src}
                    alt="OpenSilício"
                    sx={{
                      height: 100,
                      opacity: (theme) => theme.palette.mode === 'dark' ? 0.8 : 0.6,
                      filter: (theme) => theme.palette.mode === 'dark' 
                        ? 'grayscale(50%) brightness(1.2)' 
                        : 'grayscale(100%)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        opacity: 1,
                        filter: 'grayscale(0%) brightness(1)',
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Topics Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
        <Stack spacing={8}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: '0.875rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Áreas de Estudo
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                maxWidth: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
                lineHeight: 1.2,
                color: 'text.primary',
              }}
            >
              Aprenda com Nossos Projetos
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 600,
                fontSize: '1.1rem',
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Explore os principais tópicos e áreas de conhecimento em microeletrônica.
            </Typography>
          </Stack>

          <Grid container spacing={4} justifyContent="center">
            {[
              {
                image: '/chip_closeup_stock.jpg',
                title: 'Física de Semicondutores',
                description: 'Entenda os fundamentos físicos dos materiais semicondutores e como eles funcionam em dispositivos eletrônicos.',
                badge: 'Fundamentais',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
              {
                image: '/closeup_electronic_stock.jpg',
                title: 'Circuitos Analógicos',
                description: 'Domine técnicas de design de circuitos analógicos para processamento de sinais e gerenciamento de energia.',
                badge: 'Intermediário',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              },
              {
                image: '/boardPCB_stocl.jpg',
                title: 'Circuitos Digitais',
                description: 'Aprenda sobre lógica digital, microprocessadores e arquiteturas computacionais modernas.',
                badge: 'Avançado',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              },
            ].map((topic, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Card
                    sx={{
                      width: 330,
                      minHeight: 280,
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 2px 12px rgba(0,0,0,0.3)'
                        : '0 2px 12px rgba(0,0,0,0.07)',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      background: (theme) => theme.palette.background.paper,
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.025)',
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                          ? '0 8px 24px rgba(0,0,0,0.4)'
                          : '0 8px 24px rgba(0,0,0,0.12)',
                      },
                    }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 140,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${topic.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transition: 'transform 0.6s ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%)',
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: topic.gradient,
                        color: 'white',
                        px: 2.6,
                        py: 0.75,
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        boxShadow: (theme) => theme.palette.mode === 'dark'
                          ? '0 2px 8px rgba(0,0,0,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.09)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {topic.badge}
                    </Box>
                  </Box>
                  <CardContent sx={{ pt: 2.8, pb: 2.8, px: 2.5 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.22rem',
                        color: 'text.primary',
                        mb: 1,
                        lineHeight: 1.22,
                      }}
                    >
                      {topic.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.6,
                        fontSize: '1.05rem',
                        fontWeight: 400,
                        minHeight: 55,
                      }}
                    >
                      {topic.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', pt: 2 }}>
            <Button
              component={RouterLink}
              to="/blog"
              variant="outlined"
              size="large"
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                color: 'text.primary',
                borderColor: 'rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
                },
              }}
            >
              Ver Todos os Tópicos
            </Button>
          </Box>
        </Stack>
      </Container>

      <Footer />
    </Stack>
  )
}
