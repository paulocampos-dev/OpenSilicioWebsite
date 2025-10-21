import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Link as MUILink,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { wikiApi } from '../../services/api'
import type { WikiEntry } from '../../types';
import BlockNoteEditor from '../../components/BlockNoteEditor';
import BlockNoteContent from '../../components/BlockNoteContent';

export default function WikiForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [entry, setEntry] = useState<Partial<WikiEntry>>({
    term: '',
    slug: '',
    definition: '',
    content: '',
    aliases: [],
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
          <Stack direction="row" spacing={2}>
            <Button
              variant={showPreview ? 'outlined' : 'contained'}
              startIcon={showPreview ? <EditIcon /> : <VisibilityIcon />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Editar' : 'Visualizar'}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </Stack>
        </Box>

        {!showPreview ? (
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

              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={entry.aliases || []}
                onChange={(_, newValue) => {
                  setEntry({ ...entry, aliases: newValue as string[] });
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Aliases (Também conhecido como)"
                    placeholder="Digite e pressione Enter para adicionar"
                    helperText="Formas alternativas de se referir a este termo"
                  />
                )}
              />

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Conteúdo Detalhado (Opcional)
                </Typography>
                <BlockNoteEditor
                  content={entry.content || ''}
                  onContentChange={(content) => setEntry({ ...entry, content })}
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
        ) : (
          <Stack spacing={4}>
            <Breadcrumbs aria-label="breadcrumb">
              <MUILink underline="hover" sx={{ color: 'text.secondary', cursor: 'default' }}>
                Wiki
              </MUILink>
              <Typography color="text.secondary">{entry.term || 'Termo'}</Typography>
            </Breadcrumbs>

            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                {entry.term || 'Termo'}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {entry.definition || 'Definição curta aparecerá aqui.'}
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
        )}
      </Stack>
    </form>
  );
}

