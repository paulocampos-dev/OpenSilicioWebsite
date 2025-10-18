import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { educationApi } from '../../services/api'
import type { EducationResource } from '../../types';
import RichTextEditor from '../../components/RichTextEditor';

export default function EducationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resource, setResource] = useState<Partial<EducationResource>>({
    title: '',
    description: '',
    content: '',
    content_type: 'wysiwyg',
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
                <TextField
                  label="Visão Geral"
                  value={resource.overview || ''}
                  onChange={(e) => setResource({ ...resource, overview: e.target.value })}
                  fullWidth
                  multiline
                  rows={4}
                  helperText="Descrição geral do projeto (aparece na aba 'Visão Geral')"
                />

                <TextField
                  label="Recursos"
                  value={resource.resources || ''}
                  onChange={(e) => setResource({ ...resource, resources: e.target.value })}
                  fullWidth
                  multiline
                  rows={4}
                  helperText="Lista de recursos necessários (aparece na aba 'Recursos')"
                />
              </>
            )}

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Conteúdo
              </Typography>
              <RichTextEditor
                content={resource.content || ''}
                contentType={resource.content_type || 'wysiwyg'}
                onContentChange={(content) => setResource({ ...resource, content })}
                onContentTypeChange={(content_type) =>
                  setResource({ ...resource, content_type })
                }
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
      </Stack>
    </form>
  );
}

