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
import { blogApi } from '../../services/api'
import type { BlogPost } from '../../types';
import RichTextEditor from '../../components/RichTextEditor';

export default function BlogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState<Partial<BlogPost>>({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    content_type: 'wysiwyg',
    author: '',
    image_url: '',
    category: '',
    published: false,
  });

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

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

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight={700}>
            {id ? 'Editar Post' : 'Novo Post'}
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

            <TextField
              label="Categoria"
              value={post.category}
              onChange={(e) => setPost({ ...post, category: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="URL da Imagem de Capa"
              value={post.image_url}
              onChange={(e) => setPost({ ...post, image_url: e.target.value })}
              fullWidth
            />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Conteúdo
              </Typography>
              <RichTextEditor
                content={post.content || ''}
                contentType={post.content_type || 'wysiwyg'}
                onContentChange={(content) => setPost({ ...post, content })}
                onContentTypeChange={(content_type) => setPost({ ...post, content_type })}
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
      </Stack>
    </form>
  );
}

