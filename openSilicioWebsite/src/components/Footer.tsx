import { Box, Container, Grid, Stack, Typography, Link, Divider, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import EmailIcon from '@mui/icons-material/Email'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white',
        pt: { xs: 8, md: 10 },
        pb: { xs: 4, md: 5 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/closeup_electronic_stock.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.05,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="flex-start">
          {/* Logo and Description */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack spacing={2.5}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                OpenSilício
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.7,
                  fontSize: '0.9rem',
                }}
              >
                Democratizando o design de chips através de educação aberta e colaboração.
              </Typography>
            </Stack>
          </Grid>

          {/* Quick Links - Recursos */}
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack spacing={2}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  mb: 1,
                }}
              >
                Recursos
              </Typography>
              <Link
                component={RouterLink}
                to="/educacao"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Educação
              </Link>
              <Link
                component={RouterLink}
                to="/blog"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Blog
              </Link>
              <Link
                component={RouterLink}
                to="/wiki"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Wiki
              </Link>
            </Stack>
          </Grid>

          {/* Quick Links - Sobre */}
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack spacing={2}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  mb: 1,
                }}
              >
                Sobre
              </Typography>
              <Link
                component={RouterLink}
                to="/sobre"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Nossa História
              </Link>
              <Link
                component={RouterLink}
                to="/educacao"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Eventos
              </Link>
              <Link
                component={RouterLink}
                to="/blog"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  transition: 'color 0.3s ease',
                  '&:hover': {
                    color: 'white',
                  },
                }}
              >
                Projetos
              </Link>
            </Stack>
          </Grid>

          {/* Contact Information */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2.5}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  mb: 1,
                }}
              >
                Contato
              </Typography>

              {/* Email */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <EmailIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }} />
                <Link
                  href="mailto:opensilicio@gmail.com"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.3s ease',
                    '&:hover': {
                      color: 'white',
                    },
                  }}
                >
                  opensilicio@gmail.com
                </Link>
              </Stack>

              {/* Social Media */}
              <Stack direction="row" spacing={2}>
                <Link
                  href="https://www.instagram.com/opensilicio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'white',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <InstagramIcon sx={{ fontSize: 28 }} />
                </Link>
                <Link
                  href="https://www.linkedin.com/company/opensilicio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'white',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <LinkedInIcon sx={{ fontSize: 28 }} />
                </Link>
              </Stack>

              {/* Location */}
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <LocationOnIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', mt: 0.3 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: 1.6,
                        fontSize: '0.9rem',
                      }}
                    >
                      Escola Politécnica da USP
                      <br />
                      Av. Prof. Luciano Gualberto, trav. 3, 158
                      <br />
                      São Paulo - SP, 05508-010
                    </Typography>
                  </Box>
                </Stack>

                {/* Small Map */}
                <Box
                  sx={{
                    width: '100%',
                    height: 100,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.8571788848367!2d-46.73196892377715!3d-23.55816996166836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce561c8ca73f31%3A0xc82c181c9b7eaf3e!2sEscola%20Polit%C3%A9cnica%20da%20USP!5e0!3m2!1sen!2sbr!4v1710000000000!5m2!1sen!2sbr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização Escola Politécnica da USP"
                  />
                </Box>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Bar */}
        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.85rem',
            }}
          >
            © {new Date().getFullYear()} OpenSilício - Todos os direitos reservados
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
              }}
            >
              Grupo de Pesquisa e Extensão - Poli USP
            </Typography>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="small"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.3)',
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': {
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Admin
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
