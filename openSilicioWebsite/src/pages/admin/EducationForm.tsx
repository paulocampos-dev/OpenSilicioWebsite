import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { educationApi } from '../../services/api'
import type { EducationResource } from '../../types';
import BlockNoteEditor from '../../components/BlockNoteEditor';
import BlockNoteContent from '../../components/BlockNoteContent';

export default function EducationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<'Visão geral' | 'Conteúdo' | 'Recursos'>('Visão geral');
  const [resource, setResource] = useState<Partial<EducationResource>>({
    title: '',
    description: '',
    content: '',
    category: '',
    published: false,
  });

  useEffect(() => {
    if (id) {
      loadResource();
    }
  }, [id]);

  const loadResource = async () => {
    try {
      const data = await educationApi.getById(id!);
      setResource(data);
    } catch (error) {
      console.error('Erro ao carregar recurso:', error);
      alert('Erro ao carregar recurso');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await educationApi.update(id, resource);
      } else {
        await educationApi.create(resource);
      }
      navigate('/admin/educacao');
    } catch (error: any) {
      console.error('Erro ao salvar recurso:', error);
      alert(error.response?.data?.error || 'Erro ao salvar recurso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight={700}>
            {id ? 'Editar Recurso' : 'Novo Recurso'}
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
                label="Título"
                value={resource.title}
                onChange={(e) => setResource({ ...resource, title: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Descrição"
                value={resource.description}
                onChange={(e) => setResource({ ...resource, description: e.target.value })}
                required
                fullWidth
                multiline
                rows={3}
              />

              <TextField
                label="Categoria"
                value={resource.category}
                onChange={(e) => setResource({ ...resource, category: e.target.value })}
                required
                fullWidth
                select
              >
                <MenuItem value="Projetos">Projetos</MenuItem>
                <MenuItem value="Guias">Guias</MenuItem>
                <MenuItem value="Tutoriais">Tutoriais</MenuItem>
              </TextField>

              {resource.category === 'Projetos' && (
                <>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Visão Geral
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Descrição geral do projeto (aparece na aba 'Visão Geral')
                    </Typography>
                    <BlockNoteEditor
                      content={resource.overview || ''}
                      onContentChange={(content) => setResource({ ...resource, overview: content })}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Recursos
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Lista de recursos necessários (aparece na aba 'Recursos')
                    </Typography>
                    <BlockNoteEditor
                      content={resource.resources || ''}
                      onContentChange={(content) => setResource({ ...resource, resources: content })}
                    />
                  </Box>
                </>
              )}

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Conteúdo
                </Typography>
                <BlockNoteEditor
                  content={resource.content || ''}
                  onContentChange={(content) => setResource({ ...resource, content })}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={resource.published}
                    onChange={(e) => setResource({ ...resource, published: e.target.checked })}
                  />
                }
                label="Publicar"
              />
            </Stack>
          </Paper>
        ) : (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={4}>
              <Stack spacing={1}>
                <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} fontWeight={900}>
                  {resource.title || 'Título do Recurso'}
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
                  {resource.description || 'Descrição do recurso aparecerá aqui.'}
                </Typography>
              </Stack>

              {resource.category === 'Projetos' ? (
                <>
                  <Box>
                    <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} variant="scrollable" allowScrollButtonsMobile>
                      {(['Visão geral','Conteúdo','Recursos'] as const).map((t) => (
                        <Tab key={t} value={t} label={t} />
                      ))}
                    </Tabs>
                    <Divider />
                  </Box>

                  <Stack spacing={3}>
                    {previewTab === 'Visão geral' && (
                      <BlockNoteContent content={resource.overview || ''} />
                    )}
                    {previewTab === 'Conteúdo' && (
                      <BlockNoteContent content={resource.content || ''} />
                    )}
                    {previewTab === 'Recursos' && (
                      <BlockNoteContent content={resource.resources || ''} />
                    )}
                  </Stack>
                </>
              ) : (
                <Stack spacing={3}>
                  <BlockNoteContent content={resource.content || ''} />
                </Stack>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </form>
  );
}

