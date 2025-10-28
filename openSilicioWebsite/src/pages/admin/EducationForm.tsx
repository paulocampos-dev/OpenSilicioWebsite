import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
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
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { educationApi } from '../../services/api'
import type { EducationResource } from '../../types';
import LexicalEditor from '../../components/LexicalEditor';
import LexicalContent from '../../components/LexicalContent';

export default function EducationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<'Visão geral' | 'Conteúdo' | 'Recursos'>('Visão geral');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [resource, setResource] = useState<Partial<EducationResource>>({
    title: '',
    description: '',
    content: '',
    category: '',
    difficulty: '',
    published: false,
  });
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (id) {
      loadResource();
    }
    
    // Cleanup auto-save timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [id]);

  const loadResource = async () => {
    try {
      const data = await educationApi.getById(id!);
      setResource(data);
      setLastSaved(new Date(data.updated_at));
    } catch (error) {
      console.error('Erro ao carregar recurso:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar recurso', severity: 'error' });
    }
  };

  // Auto-save function
  const autoSave = useCallback(async (resourceData: Partial<EducationResource>) => {
    // Only auto-save if the resource already exists (has an ID)
    if (!resourceData.id) return;

    try {
      await educationApi.update(resourceData.id, resourceData);
      setLastSaved(new Date());
      setSnackbar({ open: true, message: 'Rascunho salvo automaticamente', severity: 'info' });
    } catch (error) {
      console.error('Erro ao salvar automaticamente:', error);
    }
  }, []);

  // Trigger auto-save when resource content changes
  useEffect(() => {
    // Don't auto-save if there's no ID yet or if we're in preview mode
    if (!resource.id || showPreview) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (30 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(resource);
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [resource, showPreview, autoSave]);

  // Manual save function (used for auto-save before wiki link dialog)
  const handleSave = async (showNotification = true) => {
    try {
      let savedResource;
      if (resource.id) {
        savedResource = await educationApi.update(resource.id, resource);
        if (showNotification) {
          setSnackbar({ open: true, message: 'Recurso salvo!', severity: 'success' });
        }
      } else {
        savedResource = await educationApi.create(resource);
        setResource(savedResource);
        if (showNotification) {
          setSnackbar({ open: true, message: 'Recurso criado!', severity: 'success' });
        }
      }
      setLastSaved(new Date());
      return savedResource;
    } catch (error: any) {
      console.error('Erro ao salvar recurso:', error);
      if (showNotification) {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.error || 'Erro ao salvar recurso', 
          severity: 'error' 
        });
      }
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const savedResource = await handleSave(true);
      // If it's a new resource, navigate to edit mode
      if (!id && savedResource) {
        setTimeout(() => {
          navigate(`/admin/educacao/edit/${savedResource.id}`);
        }, 1500);
      }
    } catch (error) {
      // Error already handled in handleSave
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const updatedResource = { ...resource, published: !resource.published };
      const savedResource = await educationApi.update(resource.id!, updatedResource);
      setResource(savedResource);
      setLastSaved(new Date());
      setSnackbar({ 
        open: true, 
        message: savedResource.published ? 'Recurso publicado com sucesso!' : 'Recurso despublicado com sucesso!', 
        severity: 'success' 
      });
    } catch (error: any) {
      console.error('Erro ao publicar recurso:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Erro ao publicar recurso', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {id ? 'Editar Recurso' : 'Novo Recurso'}
            </Typography>
            {lastSaved && (
              <Typography variant="caption" color="text.secondary">
                Última alteração: {lastSaved.toLocaleTimeString('pt-BR')}
              </Typography>
            )}
          </Box>
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
            {resource.id && (
              <Button
                variant={resource.published ? 'outlined' : 'contained'}
                color={resource.published ? 'warning' : 'success'}
                startIcon={resource.published ? <UnpublishedIcon /> : <PublishIcon />}
                onClick={handlePublish}
                disabled={loading}
              >
                {resource.published ? 'Despublicar' : 'Publicar'}
              </Button>
            )}
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

              <TextField
                label="Dificuldade"
                value={resource.difficulty || ''}
                onChange={(e) => setResource({ ...resource, difficulty: e.target.value })}
                fullWidth
                select
                helperText="Selecione o nível de dificuldade deste recurso (opcional)"
              >
                <MenuItem value="">Nenhuma</MenuItem>
                <MenuItem value="Iniciante">Iniciante</MenuItem>
                <MenuItem value="Intermediário">Intermediário</MenuItem>
                <MenuItem value="Avançado">Avançado</MenuItem>
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
                    <LexicalEditor
                      content={resource.overview || ''}
                      onContentChange={(content) => setResource({ ...resource, overview: content })}
                      contentType="education"
                      contentId={resource.id}
                      onBeforeWikiLink={async () => {
                        // Auto-save before opening wiki link dialog
                        if (!resource.id) {
                          await handleSave(false);
                        }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Recursos
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Lista de recursos necessários (aparece na aba 'Recursos')
                    </Typography>
                    <LexicalEditor
                      content={resource.resources || ''}
                      onContentChange={(content) => setResource({ ...resource, resources: content })}
                      contentType="education"
                      contentId={resource.id}
                      onBeforeWikiLink={async () => {
                        // Auto-save before opening wiki link dialog
                        if (!resource.id) {
                          await handleSave(false);
                        }
                      }}
                    />
                  </Box>
                </>
              )}

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Conteúdo
                </Typography>
                <LexicalEditor
                  content={resource.content || ''}
                  onContentChange={(content) => setResource({ ...resource, content })}
                  contentType="education"
                  contentId={resource.id}
                  onBeforeWikiLink={async () => {
                    // Auto-save before opening wiki link dialog
                    if (!resource.id) {
                      await handleSave(false);
                    }
                  }}
                />
              </Box>
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
                      <LexicalContent content={resource.overview || ''} />
                    )}
                    {previewTab === 'Conteúdo' && (
                      <LexicalContent content={resource.content || ''} />
                    )}
                    {previewTab === 'Recursos' && (
                      <LexicalContent content={resource.resources || ''} />
                    )}
                  </Stack>
                </>
              ) : (
                <Stack spacing={3}>
                  <LexicalContent content={resource.content || ''} />
                </Stack>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </form>
  );
}

