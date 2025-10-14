import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { wikiApi } from '../../services/api'
import type { WikiEntry } from '../../types';
import RichTextEditor from '../../components/RichTextEditor';

export default function WikiForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Partial<WikiEntry>>({
    term: '',
    slug: '',
    definition: '',
    content: '',
    content_type: 'wysiwyg',
    published: false,
  });

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      const data = await wikiApi.getBySlug(id!);
      setEntry(data);
    } catch (error) {
      console.error('Erro ao carregar entrada:', error);
      alert('Erro ao carregar entrada');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id && entry.id) {
        await wikiApi.update(entry.id, entry);
      } else {
        await wikiApi.create(entry);
      }
      navigate('/admin/wiki');
    } catch (error: any) {
      console.error('Erro ao salvar entrada:', error);
      alert(error.response?.data?.error || 'Erro ao salvar entrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight={700}>
            {id ? 'Editar Entrada' : 'Nova Entrada'}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Termo"
              value={entry.term}
              onChange={(e) => setEntry({ ...entry, term: e.target.value })}
              required
              fullWidth
              helperText="Nome do conceito ou termo"
            />

            <TextField
              label="Slug (URL amigável)"
              value={entry.slug}
              onChange={(e) => setEntry({ ...entry, slug: e.target.value })}
              required
              fullWidth
              helperText="Use apenas letras minúsculas, números e hífens"
            />

            <TextField
              label="Definição Curta"
              value={entry.definition}
              onChange={(e) => setEntry({ ...entry, definition: e.target.value })}
              required
              fullWidth
              multiline
              rows={2}
              helperText="Uma definição breve que será exibida em tooltips"
            />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Conteúdo Detalhado (Opcional)
              </Typography>
              <RichTextEditor
                content={entry.content || ''}
                contentType={entry.content_type || 'wysiwyg'}
                onContentChange={(content) => setEntry({ ...entry, content })}
                onContentTypeChange={(content_type) => setEntry({ ...entry, content_type })}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={entry.published}
                  onChange={(e) => setEntry({ ...entry, published: e.target.checked })}
                />
              }
              label="Publicar"
            />
          </Stack>
        </Paper>
      </Stack>
    </form>
  );
}

