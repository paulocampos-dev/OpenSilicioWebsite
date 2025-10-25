import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  FormControlLabel,
  Link as MUILink,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import { blogApi, uploadApi } from '../../services/api'
import type { BlogPost } from '../../types';
import LexicalEditor from '../../components/LexicalEditor';
import LexicalContent from '../../components/LexicalContent';

export default function BlogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [post, setPost] = useState<Partial<BlogPost>>({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    author: '',
    image_url: '',
    category: '',
    published: false,
  });
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadCategories();
    if (id) {
      loadPost();
    }
    
    // Cleanup auto-save timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await blogApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadPost = async () => {
    try {
      const data = await blogApi.getById(id!);
      setPost(data);
      setLastSaved(new Date(data.updated_at));
    } catch (error) {
      console.error('Erro ao carregar post:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar post', severity: 'error' });
    }
  };

  // Auto-save function
  const autoSave = useCallback(async (postData: Partial<BlogPost>) => {
    // Only auto-save if the post already exists (has an ID)
    if (!postData.id) return;

    try {
      await blogApi.update(postData.id, postData);
      setLastSaved(new Date());
      setSnackbar({ open: true, message: 'Rascunho salvo automaticamente', severity: 'info' });
    } catch (error) {
      console.error('Erro ao salvar automaticamente:', error);
    }
  }, []);

  // Trigger auto-save when post content changes
  useEffect(() => {
    // Don't auto-save if there's no ID yet or if we're in preview mode
    if (!post.id || showPreview) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (30 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(post);
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [post, showPreview, autoSave]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const savedPost = await handleSave(true);
      // If it's a new post, navigate to edit mode
      if (!id && savedPost) {
        setTimeout(() => {
          navigate(`/admin/blog/edit/${savedPost.id}`);
        }, 1500);
      }
    } catch (error) {
      // Error already handled in handleSave
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Manual save function (used for auto-save before wiki link dialog)
  const handleSave = async (showNotification = true) => {
    try {
      let savedPost;
      if (post.id) {
        savedPost = await blogApi.update(post.id, post);
        if (showNotification) {
          setSnackbar({ open: true, message: 'Post salvo!', severity: 'success' });
        }
      } else {
        savedPost = await blogApi.create(post);
        setPost(savedPost);
        if (showNotification) {
          setSnackbar({ open: true, message: 'Post criado!', severity: 'success' });
        }
      }
      setLastSaved(new Date());
      return savedPost;
    } catch (error: any) {
      console.error('Erro ao salvar post:', error);
      if (showNotification) {
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.error || 'Erro ao salvar post', 
          severity: 'error' 
        });
      }
      throw error;
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const updatedPost = { ...post, published: !post.published };
      const savedPost = await blogApi.update(post.id!, updatedPost);
      setPost(savedPost);
      setLastSaved(new Date());
      setSnackbar({ 
        open: true, 
        message: savedPost.published ? 'Post publicado com sucesso!' : 'Post despublicado com sucesso!', 
        severity: 'success' 
      });
    } catch (error: any) {
      console.error('Erro ao publicar post:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Erro ao publicar post', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const result = await uploadApi.uploadTeamMemberImage(file, (progress) => {
        setUploadProgress(progress);
      });
      setPost({ ...post, image_url: result.url });
      alert(`Imagem enviada com sucesso! ${(result.size / 1024).toFixed(1)}KB`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {id ? 'Editar Post' : 'Novo Post'}
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
            {post.id && (
              <Button
                variant={post.published ? 'outlined' : 'contained'}
                color={post.published ? 'warning' : 'success'}
                startIcon={post.published ? <UnpublishedIcon /> : <PublishIcon />}
                onClick={handlePublish}
                disabled={loading}
              >
                {post.published ? 'Despublicar' : 'Publicar'}
              </Button>
            )}
          </Stack>
        </Box>

        {!showPreview ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Título"
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Slug (URL amigável)"
                value={post.slug}
                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                required
                fullWidth
                helperText="Use apenas letras minúsculas, números e hífens"
              />

              <TextField
                label="Resumo"
                value={post.excerpt}
                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                required
                fullWidth
                multiline
                rows={3}
              />

              <TextField
                label="Autor"
                value={post.author}
                onChange={(e) => setPost({ ...post, author: e.target.value })}
                required
                fullWidth
              />

              <Autocomplete
                freeSolo
                options={categories}
                value={post.category || ''}
                onChange={(_, newValue) => setPost({ ...post, category: newValue || '' })}
                onInputChange={(_, newInputValue) => setPost({ ...post, category: newInputValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoria"
                    required
                    helperText="Selecione uma categoria existente ou digite uma nova"
                  />
                )}
              />

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Imagem de Capa
                </Typography>

                {post.image_url && (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={post.image_url}
                      alt="Cover"
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </Box>
                )}

                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  disabled={uploadingImage}
                >
                  {uploadingImage
                    ? `Enviando... ${uploadProgress}%`
                    : post.image_url
                    ? 'Trocar Imagem'
                    : 'Enviar Imagem'}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleCoverImageUpload(file);
                      }
                    }}
                  />
                </Button>

                {uploadingImage && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Box
                      sx={{
                        width: `${uploadProgress}%`,
                        height: 4,
                        bgcolor: 'primary.main',
                        borderRadius: 2,
                        transition: 'width 0.3s',
                      }}
                    />
                  </Box>
                )}

                {post.image_url && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setPost({ ...post, image_url: '' })}
                    sx={{ mt: 1 }}
                  >
                    Remover Imagem
                  </Button>
                )}

                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Formatos aceitos: JPEG, PNG, WebP. Máximo 5MB. Será redimensionada e comprimida automaticamente.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Conteúdo
                </Typography>
                <LexicalEditor
                  content={post.content || ''}
                  onContentChange={(content) => setPost({ ...post, content })}
                  contentType="blog"
                  contentId={post.id}
                  onBeforeWikiLink={async () => {
                    // Auto-save before opening wiki link dialog
                    if (!post.id) {
                      await handleSave(false);
                    }
                  }}
                />
              </Box>
            </Stack>
          </Paper>
        ) : (
          <Stack spacing={4}>
            <Stack spacing={1}>
              <Breadcrumbs aria-label="breadcrumb">
                <MUILink underline="hover" sx={{ color: 'text.secondary', cursor: 'default' }}>
                  Blog
                </MUILink>
                <Typography color="text.secondary">{post.title || 'Título do Post'}</Typography>
              </Breadcrumbs>
              <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} fontWeight={800}>
                {post.title || 'Título do Post'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Por {post.author || 'Autor'} • {new Date().toLocaleDateString('pt-BR')}
              </Typography>
            </Stack>

            {post.image_url && (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: 2,
                  backgroundImage: `url(${post.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            <Stack spacing={2} sx={{ maxWidth: '100%' }}>
              <LexicalContent content={post.content || ''} />
            </Stack>
          </Stack>
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

