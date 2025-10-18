import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
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
import UploadIcon from '@mui/icons-material/Upload';
import { blogApi, uploadApi } from '../../services/api'
import type { BlogPost } from '../../types';
import BlockNoteEditor from '../../components/BlockNoteEditor';
import BlockNoteContent from '../../components/BlockNoteContent';

export default function BlogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  useEffect(() => {
    loadCategories();
    if (id) {
      loadPost();
    }
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
      const data = await blogApi.getBySlug(id!);
      setPost(data);
    } catch (error) {
      console.error('Erro ao carregar post:', error);
      alert('Erro ao carregar post');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await blogApi.update(post.id!, post);
      } else {
        await blogApi.create(post);
      }
      navigate('/admin/blog');
    } catch (error: any) {
      console.error('Erro ao salvar post:', error);
      alert(error.response?.data?.error || 'Erro ao salvar post');
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight={700}>
            {id ? 'Editar Post' : 'Novo Post'}
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
                <BlockNoteEditor
                  content={post.content || ''}
                  onContentChange={(content) => setPost({ ...post, content })}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={post.published}
                    onChange={(e) => setPost({ ...post, published: e.target.checked })}
                  />
                }
                label="Publicar"
              />
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
              <BlockNoteContent content={post.content || ''} />
            </Stack>
          </Stack>
        )}
      </Stack>
    </form>
  );
}

