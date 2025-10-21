import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Breadcrumbs, Link as MUILink, Paper, Stack, Typography, Divider, Chip, Alert, Button, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { wikiApi } from '../services/api'
import type { WikiEntry } from '../types';
import BlockNoteContent from '../components/BlockNoteContent';

export default function WikiDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [entry, setEntry] = useState<WikiEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [pendingTerm, setPendingTerm] = useState('');
  const [otherEntries, setOtherEntries] = useState<WikiEntry[]>([]);

  useEffect(() => {
    if (slug) {
      loadEntry();
    }
  }, [slug]);

  const loadEntry = async () => {
    try {
      // Check if this is a pending wiki link
      if (slug?.startsWith('pending-')) {
        setIsPending(true);
        // Extract the term from the slug (remove 'pending-' prefix and replace dashes with spaces)
        const term = slug.replace('pending-', '').replace(/-/g, ' ');
        setPendingTerm(term);
        
        // Load other wiki entries to suggest
        const response = await wikiApi.getAll(true, 1, 6); // Get first 6 published entries
        setOtherEntries(response.data || []);
      } else {
        // Normal wiki entry lookup
        const data = await wikiApi.getBySlug(slug!);

        // Development logging
        if (import.meta.env.DEV) {
          console.log('📖 Wiki entry loaded:', {
            term: data.term,
            slug: data.slug,
            hasDefinition: !!data.definition?.trim(),
            definitionLength: data.definition?.length || 0,
            hasContent: !!data.content?.trim(),
            contentLength: data.content?.length || 0,
          });

          if (!data.definition || !data.definition.trim()) {
            console.warn('⚠️ Wiki entry has empty definition field');
          }
        }

        setEntry(data);
      }
    } catch (error) {
      console.error('Erro ao carregar entrada:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  // Show pending entry page
  if (isPending) {
    return (
      <Stack spacing={4} sx={{ minHeight: '60vh' }}>
        <Breadcrumbs aria-label="breadcrumb">
          <MUILink component={RouterLink} to="/wiki" underline="hover">
            Wiki
          </MUILink>
          <Typography color="text.secondary">{pendingTerm}</Typography>
        </Breadcrumbs>

        <Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            {pendingTerm}
          </Typography>
          
          <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mt: 3 }}>
            <Typography variant="body1" gutterBottom>
              Esta entrada ainda não foi criada. Estamos trabalhando para adicionar mais conteúdo à nossa wiki.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enquanto isso, você pode explorar outros tópicos abaixo ou voltar para a lista completa.
            </Typography>
          </Alert>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoStoriesIcon />
            Explore outros tópicos
          </Typography>
          
          {otherEntries.length > 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {otherEntries.map((otherEntry) => (
                <Grid item xs={12} sm={6} md={4} key={otherEntry.id}>
                  <Card variant="outlined">
                    <CardActionArea component={RouterLink} to={`/wiki/${otherEntry.slug}`}>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {otherEntry.term}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {otherEntry.definition}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Nenhuma entrada disponível no momento.
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            component={RouterLink}
            to="/wiki"
            variant="contained"
            size="large"
          >
            Ver todas as entradas
          </Button>
        </Box>
      </Stack>
    );
  }

  if (!entry) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, minHeight: '60vh' }}>
        <Typography variant="h5">Entrada não encontrada</Typography>
        <Button
          component={RouterLink}
          to="/wiki"
          variant="contained"
          sx={{ mt: 3 }}
        >
          Voltar para a Wiki
        </Button>
      </Box>
    );
  }

  return (
    <Stack spacing={4} sx={{ minHeight: '60vh' }}>
      <Breadcrumbs aria-label="breadcrumb">
        <MUILink component={RouterLink} to="/wiki" underline="hover">
          Wiki
        </MUILink>
        <Typography color="text.secondary">{entry.term}</Typography>
      </Breadcrumbs>

      <Box>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          {entry.term}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {entry.definition}
        </Typography>

        {entry.aliases && entry.aliases.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Também conhecido como:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {entry.aliases.map((alias) => (
                <Chip
                  key={alias}
                  label={alias}
                  variant="outlined"
                  color="secondary"
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      <Divider />

      {entry.content && (
        <Paper sx={{ p: 4 }}>
          <BlockNoteContent content={entry.content} />
        </Paper>
      )}
    </Stack>
  );
}

