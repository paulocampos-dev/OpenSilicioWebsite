import { useState, useEffect } from 'react'
import { Box, Container, Grid, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { settingsApi } from '../services/api'
import type { SiteSettings } from '../types'
import BlueprintFrame from '../components/design/BlueprintFrame'
import DuotonePhoto from '../components/design/DuotonePhoto'
import TitleBlockBar from '../components/design/TitleBlockBar'

const quickStart = [
  { n: '01', title: 'Trilha de aprendizado', desc: 'Siga um caminho guiado e comece pela base certa.', to: '/educacao', label: 'Educação' },
  { n: '02', title: 'Explorar wiki', desc: 'Busque termos e conceitos essenciais rapidamente.', to: '/wiki', label: 'Wiki' },
  { n: '03', title: 'Ler o blog', desc: 'Tutoriais e novidades do ecossistema de microeletrônica.', to: '/blog', label: 'Blog' },
]

const offerings = [
  { title: 'Educação estruturada', desc: 'Guias, tutoriais, teóricos e projetos organizados do iniciante ao avançado.' },
  { title: 'Blog técnico', desc: 'Registros de bancada, decisões de projeto e novidades do ecossistema aberto.' },
  { title: 'Wiki técnica', desc: 'Dicionário de termos em português, ligado de dentro dos textos do site.' },
  { title: 'Projetos open source', desc: 'Cada projeto com visão geral, conteúdo e recursos.' },
  { title: 'Comunidade ativa', desc: 'Estudantes, pesquisadores e engenheiros trabalhando no mesmo repositório.' },
  { title: 'Eventos e workshops', desc: 'Calendário próprio: oficinas de layout, semanas temáticas e mutirões de tape-out.' },
]

export default function Landing() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    settingsApi.getAll().then(setSettings).catch(() => {})
  }, [])

  return (
    <Stack sx={{ m: 0, p: 0 }}>
      {/* Hero — the steel field */}
      <Box className="field" sx={{ py: { xs: 6, md: 9 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <span
                className="kicker"
                style={{
                  display: 'inline-block',
                  color: 'var(--color-steel-300)',
                  border: '1px solid var(--color-line-on-field)',
                  padding: '8px 12px',
                }}
              >
                Grupo de Pesquisa e Extensão · Poli USP
              </span>
              <Typography
                component="h1"
                sx={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: { xs: '44px', md: '76px' },
                  lineHeight: { xs: '46px', md: '78px' },
                  letterSpacing: '.01em',
                  textTransform: 'uppercase',
                  marginLeft: 'var(--optical-left)',
                  mt: 3,
                }}
              >
                Democratizando o design de chips
              </Typography>
              <Typography sx={{ fontSize: '17px', lineHeight: '26px', mt: 3, maxWidth: '56ch', color: 'var(--color-on-field-muted)' }}>
                Formamos a próxima geração de projetistas de circuitos integrados através de educação aberta, projetos práticos e colaboração.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                <RouterLink to="/educacao" className="btn btn-primary">Começar a Aprender</RouterLink>
                <RouterLink
                  to="/wiki"
                  className="btn"
                  style={{ color: 'var(--color-on-field)', border: '1px solid var(--color-line-on-field)' }}
                >
                  Explorar Wiki
                </RouterLink>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <BlueprintFrame frameless>
                <DuotonePhoto src="/hero-chip-closeup.jpg" alt="Close-up de um chip" label="Foto: close-up de chip" aspectRatio="4 / 3" sweepOnLoad />
              </BlueprintFrame>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Acesso rápido — a drawn sheet */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <BlueprintFrame sx={{ p: 0 }}>
          <TitleBlockBar title="Acesso rápido — por onde começar" cells={['Folha 01']} />
          <table className="table table-stack" style={{ tableLayout: 'fixed' }}>
            <tbody>
              {quickStart.map((item) => (
                <tr key={item.n}>
                  <td style={{ width: 64, fontSize: 13, fontWeight: 600, letterSpacing: '.08em', color: 'var(--color-accent-ink)' }}>{item.n}</td>
                  <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, letterSpacing: '.02em', textTransform: 'uppercase' }}>{item.title}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{item.desc}</td>
                  <td style={{ width: 160 }}>
                    <RouterLink to={item.to} className="btn btn-ghost" style={{ fontSize: 14 }}>{item.label} →</RouterLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BlueprintFrame>
      </Container>

      {/* Sobre */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={7} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <BlueprintFrame duotone frameless>
              <DuotonePhoto src="/sobre-bancada-placa.jpg" alt="Bancada com placa de circuito" label="Foto: bancada / placa" aspectRatio="4 / 3" sweepOnLoad />
            </BlueprintFrame>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <span className="kicker">02 · Sobre o OpenSilício</span>
            <Box className="caption-rule" />
            <Typography component="h3" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '36px', lineHeight: '38px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
              Microeletrônica aberta, na Poli
            </Typography>
            <Typography sx={{ fontSize: '16px', lineHeight: '24px', mt: 2.5, maxWidth: '58ch', color: 'var(--color-text-muted)' }}>
              Somos um grupo de pesquisa e extensão da Escola Politécnica da USP dedicado a abrir o projeto de circuitos integrados: ferramentas livres, PDKs abertos e material didático em português, produzido por quem está aprendendo junto.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <RouterLink to="/sobre" className="btn btn-secondary">Conheça Nossa História</RouterLink>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* O que oferecemos */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <span className="kicker">03 · O que oferecemos</span>
        <Box className="caption-rule" sx={{ mb: 3 }} />
        <Grid container spacing={4}>
          {offerings.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <BlueprintFrame sx={{ p: 3, height: '100%' }}>
                <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '22px', lineHeight: '24px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                  {item.title}
                </Typography>
                <Typography sx={{ fontSize: '15px', lineHeight: '24px', mt: 1.5, color: 'var(--color-text-muted)' }}>{item.desc}</Typography>
              </BlueprintFrame>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Áreas de estudo — featured education */}
      {settings?.featured_education_resources && settings.featured_education_resources.length > 0 && (
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1.5 }}>
            <span className="kicker" style={{ margin: 0 }}>04 · Áreas de estudo em destaque</span>
            <RouterLink to="/educacao" style={{ fontSize: 14 }}>Ver toda a Educação →</RouterLink>
          </Stack>
          <Box className="caption-rule" sx={{ mb: 3 }} />
          <Grid container spacing={4}>
            {settings.featured_education_resources.map((resource) => (
              <Grid key={resource.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <RouterLink to={`/educacao/${resource.id}`} className="card blueprint" style={{ padding: 0, textDecoration: 'none', color: 'inherit', gap: 0 }}>
                  <DuotonePhoto
                    src={resource.image_url}
                    alt={resource.title}
                    label="Miniatura"
                    variant="category-watermark"
                    sx={{ borderBottom: '1px solid var(--color-line)' }}
                  />
                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <span className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>{resource.category}{resource.difficulty ? ` · ${resource.difficulty}` : ''}</span>
                    <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '24px', lineHeight: '26px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                      {resource.title}
                    </Typography>
                    <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>{resource.description}</Typography>
                  </Box>
                </RouterLink>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Posts em destaque — featured blog */}
      {settings?.featured_blog_posts && settings.featured_blog_posts.length > 0 && (
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1.5 }}>
            <span className="kicker" style={{ margin: 0 }}>05 · Posts em destaque</span>
            <RouterLink to="/blog" style={{ fontSize: 14 }}>Ver todo o Blog →</RouterLink>
          </Stack>
          <Box className="caption-rule" sx={{ mb: 3 }} />
          <Grid container spacing={4}>
            {settings.featured_blog_posts.map((post) => (
              <Grid key={post.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <RouterLink to={`/blog/${post.slug}`} className="card blueprint" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="kicker" style={{ margin: 0 }}>{post.category}</span>
                  <Typography component="h4" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '24px', lineHeight: '26px', letterSpacing: '.02em', textTransform: 'uppercase' }}>
                    {post.title}
                  </Typography>
                  <Typography sx={{ fontSize: '15px', lineHeight: '24px', color: 'var(--color-text-muted)' }}>{post.excerpt}</Typography>
                  <Typography sx={{ fontSize: '13px', color: 'var(--color-text-faint)' }}>Por {post.author}</Typography>
                </RouterLink>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Apoiadores e parceiros */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <span className="kicker">06 · Apoiadores e parceiros</span>
        <Box className="caption-rule" sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[
            { name: 'Amigos da Poli', href: 'https://www.amigosdapoli.com.br/' },
            { name: 'TinyTapeout', href: 'https://tinytapeout.com/' },
          ].map((sponsor) => (
            <Grid key={sponsor.name} size={{ xs: 6, sm: 3 }}>
              <Box
                component="a"
                href={sponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none', display: 'block' }}
              >
                <BlueprintFrame sx={{ display: 'grid', placeItems: 'center', p: 3, minHeight: 96 }}>
                  <Typography sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '20px', letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--color-accent-ink)' }}>
                    {sponsor.name}
                  </Typography>
                </BlueprintFrame>
              </Box>
            </Grid>
          ))}
          {[1, 2].map((slot) => (
            <Grid key={slot} size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  display: 'grid', placeItems: 'center', p: 3, minHeight: 96,
                  border: '1px dashed var(--color-neutral-400)',
                  fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)',
                }}
              >
                Vaga de parceiro
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Stack>
  )
}
