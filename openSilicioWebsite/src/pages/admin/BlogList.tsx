import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PublishIcon from '@mui/icons-material/Publish';
import { blogApi } from '../../services/api'
import type { BlogPost } from '../../types';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      // Load all posts (published and unpublished) for admin with high limit
      const response = await blogApi.getAll(undefined, 1, 100);
      setPosts(response.data);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este post?')) {
      return;
    }

    try {
      await blogApi.delete(id);
      loadPosts();
      setSnackbar({ open: true, message: 'Post deletado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      setSnackbar({ open: true, message: 'Erro ao deletar post', severity: 'error' });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await blogApi.update(id, { published: true });
      loadPosts();
      setSnackbar({ open: true, message: 'Post publicado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao publicar post:', error);
      setSnackbar({ open: true, message: 'Erro ao publicar post', severity: 'error' });
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          Posts do Blog
        </Typography>
        <Button
          component={RouterLink}
          to="/admin/blog/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Novo Post
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum post encontrado
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={post.published ? 'Publicado' : 'Rascunho'}
                      color={post.published ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">
                    {!post.published && (
                      <IconButton
                        onClick={() => handlePublish(post.id)}
                        size="small"
                        color="success"
                        title="Publicar"
                      >
                        <PublishIcon />
                      </IconButton>
                    )}
                    <IconButton
                      component={RouterLink}
                      to={`/admin/blog/edit/${post.id}`}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(post.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
    </Stack>
  );
}

