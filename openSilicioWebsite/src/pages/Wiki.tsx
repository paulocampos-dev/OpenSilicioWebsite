import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Breadcrumbs, Link as MUILink, Paper, Stack, Typography, Divider } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { wikiApi } from '../services/api'
import type { WikiEntry } from '../types';

export default function Wiki() {
  const { slug } = useParams<{ slug: string }>();
  const [entry, setEntry] = useState<WikiEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadEntry();
    }
  }, [slug]);

  const loadEntry = async () => {
    try {
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
          contentType: data.content_type,
        });

        if (!data.definition || !data.definition.trim()) {
          console.warn('⚠️ Wiki entry has empty definition field');
        }
      }

      setEntry(data);
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

  if (!entry) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5">Entrada não encontrada</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
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
        <Typography variant="h6" color="text.secondary">
          {entry.definition}
        </Typography>
      </Box>

      <Divider />

      {entry.content && (
        <Paper sx={{ p: 4 }}>
          {entry.content_type === 'markdown' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: entry.content }} />
          )}
        </Paper>
      )}
    </Stack>
  );
}

