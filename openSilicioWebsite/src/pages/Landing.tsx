import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import { Link as RouterLink } from 'react-router-dom'

export default function Landing() {
  return (
    <Stack spacing={8}>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 360, sm: 420, md: 520 },
          p: { xs: 2, sm: 4, md: 6 },
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCbX9MI-J43khapg-f3lfg7WvbHUESmzQ_mMhqqB2vL5Shz5tBatBTLJfKWcN8ok_IXCLUcIuPLBbIyXI8M583-Eje3ghlpYtpsDEkSZuD8THUKNpWXuJOOyHI6m75IPNEbOVH7b8GyQhBeg4_pKdBqDpCARdKeUL47E-x74YOPko2BZG5Ec8J6aFL50QsWWg6eWtK9uqPYPz2SX6-axs8rB43y_z45iMOS5XI_Hnyj65uBDZb9-Yt0nnVhGhbmDPYN9dB-H71LLw")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 2,
        }}
      >
        <Box sx={{ maxWidth: 960 }}>
          <Typography
            sx={{ typography: { xs: 'h4', sm: 'h3', md: 'h2' } }}
            fontWeight={900}
            color="common.white"
          >
            Capacitando a próxima geração de projetistas de chips
          </Typography>
          <Typography color="common.white" sx={{ maxWidth: 900, mt: 1 }}>
            OpenSilício é um grupo universitário dedicado a oferecer educação acessível em eletrônica e projeto de
            circuitos integrados. Junte-se à nossa comunidade para aprender, colaborar e inovar no empolgante campo da
            microeletrônica.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/educacao"
          variant="contained"
          size="large"
          sx={{ width: { xs: 'auto', sm: 'auto' } }}
        >
          Conheça nossos programas
        </Button>
      </Box>

      {/* What We Offer */}
      <Stack spacing={4}>
        <Stack spacing={1.5}>
          <Typography sx={{ typography: { xs: 'h5', sm: 'h4' } }} fontWeight={800}>
            O que oferecemos
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
            O OpenSilício oferece diversos recursos e atividades para apoiar sua jornada de aprendizado em eletrônica e
            projeto de circuitos integrados.
          </Typography>
        </Stack>
        <Button component={RouterLink} to="/blog" variant="contained" size="large" sx={{ width: 'fit-content' }}>
          Saiba mais
        </Button>
        <Grid container spacing={3}>
          {[
            {
              icon: <DescriptionOutlinedIcon />,
              title: 'Blog abrangente',
              desc:
                'Fique por dentro das últimas tendências, tutoriais e insights na área de microeletrônica por meio do nosso blog, atualizado regularmente.',
            },
            {
              icon: <SchoolOutlinedIcon />,
              title: 'Programas educacionais',
              desc:
                'Acesse cursos e workshops estruturados, pensados para fornecer o conhecimento e as habilidades necessárias para uma carreira bem-sucedida em projeto de chips.',
            },
            {
              icon: <GroupOutlinedIcon />,
              title: 'Engajamento da comunidade',
              desc:
                'Conecte-se com estudantes, profissionais da indústria e mentores por meio de nossos fóruns e eventos ativos da comunidade.',
            },
          ].map((item) => (
            <Grid key={item.title} size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <Box color="text.primary">{item.icon}</Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary">{item.desc}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Stack>

      {/* Our Focus Areas */}
      <Stack spacing={4}>
        <Stack spacing={1.5}>
          <Typography sx={{ typography: { xs: 'h5', sm: 'h4' } }} fontWeight={800}>
            Nossas áreas de foco
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
            Cobrimos uma ampla variedade de tópicos em eletrônica e projeto de circuitos integrados, garantindo uma
            experiência educacional completa.
          </Typography>
        </Stack>
        <Button component={RouterLink} to="/blog" variant="contained" size="large" sx={{ width: 'fit-content' }}>
          Ver nossos projetos
        </Button>
        <Grid container spacing={3}>
          {[
            {
              img:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuA0ccYKOKWWVddDm8lJtQfdmNMQ-Rj8O6gT6aYwiO8gOrR6SU6a7EotupllTBJvQLz_fryPrGZXK2-iBAa8n5pyMA-eLjYF5IPvzc67ViWVL3Xqarl1J7pxodaNOr2v38RIEJIsmV32OOpF0bVzTNVHPcVKI-VExHcRFeo2-OJPYc4T30RySU2CrswBOcmiM6fp3RrQ92KlMtGxxztpDx9h72PtU-hBfrnJRkqKtmeFbZ6MI6BrIecvARDWZ8SOgcnF9UhmHpjBOw',
              title: 'Projeto de Circuitos Analógicos',
              desc:
                'Explore os princípios e técnicas por trás do projeto de circuitos analógicos, essenciais para diversas aplicações como gerenciamento de energia e processamento de sinal.',
            },
            {
              img:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAKD_WQSghn1r09Icn8HLKmd3Li1LuAf3oUX2Og-1b7m-8oaTCX3HdKgKrTLWzmAPp_PgyOZrN-zx08GqqwAyOJVj1B1vpgNH9ed6aAVsGg2uBPr0AcSyGo46pMx1I9Oh99j7g8laHiNsfL03yv9shUHJeqNEwwQa4HxhAD91cxuGEM1bfeljvA6NqZwbtoSqbd-AHJVLSJvTSPWplu6suuMp-YfPDbgOyGa-usWbnPpsBr2QGXAQHB74jlVvdro31iQwaec5clFg',
              title: 'Projeto de Circuitos Digitais',
              desc:
                'Mergulhe no mundo dos circuitos digitais, aprendendo sobre portas lógicas, microprocessadores e outros blocos fundamentais da eletrônica moderna.',
            },
            {
              img:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCIGyUW4RArbuBITk213Se0tYZ1wZ9YvCtTOBH6RqH3PEpQlnLDw32fHQzhJqtT6MMtpDtd3Pre9BaD7LqyFchd-HWm0TidxCwmeYi6Lew93OPtLjQWzZQsBhdRHrwgkmgN3VeaUkSfM9l9MF-5WrnuidWnaa7aFCs0CN1-unZEWgUm1Ti0jYnf7mM2h7mB5dIVJ7edzdsw9tv9I1tzBxAKvOGTatkLRz_x-XXzvtvS3jv-eedhHhSqOqRW-Ns0oBvoS-wzVos-Sw',
              title: 'Física de Semicondutores',
              desc:
                'Aprofunde-se nos fundamentos físicos dos semicondutores, os materiais que alimentam nossos dispositivos eletrônicos.',
            },
          ].map((item) => (
            <Grid key={item.title} size={{ xs: 12, md: 4 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: 2,
                    backgroundImage: `url(${item.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <Box>
                  <Typography fontWeight={600}>{item.title}</Typography>
                  <Typography color="text.secondary">{item.desc}</Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>

      {/* Final CTA */}
      <Stack spacing={2} textAlign="center" alignItems="center">
        <Typography sx={{ typography: { xs: 'h5', sm: 'h4' } }} fontWeight={800}>
          Pronto para começar?
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
          Junte-se ao OpenSilício hoje e faça parte de uma comunidade vibrante de aspirantes a projetistas de chips.
          Acesse recursos exclusivos, participe de projetos empolgantes e ajude a moldar o futuro da microeletrônica.
        </Typography>
        <Button component={RouterLink} to="/educacao" variant="contained" size="large">
          Junte-se à nossa comunidade
        </Button>
      </Stack>
    </Stack>
  )
}


