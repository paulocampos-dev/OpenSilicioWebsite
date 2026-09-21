import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
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
import AdminMobileItem from '../../components/admin/AdminMobileItem';

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await blogApi.delete(deleteId);
      loadPosts();
      setSnackbar({ open: true, message: 'Post deletado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      setSnackbar({ open: true, message: 'Erro ao deletar post', severity: 'error' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
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
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}>
        <Typography variant="h4" fontWeight={700}>
          Posts do Blog
        </Typography>
        <Button
          component={RouterLink}
          to="/admin/blog/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ minHeight: { xs: 48, sm: 36 } }}
        >
          Novo Post
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
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
                      onClick={() => handleDeleteClick(post.id)}
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

      <Stack spacing={1} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {loading ? <Typography sx={{ py: 3, textAlign: 'center' }}>Carregando...</Typography> : posts.length === 0 ? (
          <Typography sx={{ py: 3, textAlign: 'center' }}>Nenhum post encontrado</Typography>
        ) : posts.map((post) => (
          <AdminMobileItem
            key={post.id}
            title={post.title}
            details={<>{post.author} · {post.category} · {new Date(post.created_at).toLocaleDateString('pt-BR')}</>}
            status={<Chip label={post.published ? 'Publicado' : 'Rascunho'} color={post.published ? 'success' : 'default'} size="small" />}
            actions={(
              <>
                {!post.published && <MenuItem onClick={() => handlePublish(post.id)}>Publicar</MenuItem>}
                <MenuItem component={RouterLink} to={`/admin/blog/edit/${post.id}`}>Editar</MenuItem>
                <MenuItem onClick={() => handleDeleteClick(post.id)} sx={{ color: 'error.main' }}>Deletar</MenuItem>
              </>
            )}
          />
        ))}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
