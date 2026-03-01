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
import { educationApi } from '../../services/api'
import type { EducationResource } from '../../types';

export default function EducationList() {
  const [resources, setResources] = useState<EducationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      // Load all resources (published and unpublished) for admin with high limit
      const response = await educationApi.getAll(undefined, 1, 100);
      setResources(response.data);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
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
      await educationApi.delete(deleteId);
      loadResources();
      setSnackbar({ open: true, message: 'Recurso deletado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao deletar recurso:', error);
      setSnackbar({ open: true, message: 'Erro ao deletar recurso', severity: 'error' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
  };

  const handlePublish = async (id: string) => {
    try {
      await educationApi.update(id, { published: true });
      loadResources();
      setSnackbar({ open: true, message: 'Recurso publicado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao publicar recurso:', error);
      setSnackbar({ open: true, message: 'Erro ao publicar recurso', severity: 'error' });
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          Recursos Educacionais
        </Typography>
        <Button
          component={RouterLink}
          to="/admin/educacao/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Novo Recurso
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nenhum recurso encontrado
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>{resource.title}</TableCell>
                  <TableCell>{resource.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={resource.published ? 'Publicado' : 'Rascunho'}
                      color={resource.published ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(resource.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">
                    {!resource.published && (
                      <IconButton
                        onClick={() => handlePublish(resource.id)}
                        size="small"
                        color="success"
                        title="Publicar"
                      >
                        <PublishIcon />
                      </IconButton>
                    )}
                    <IconButton
                      component={RouterLink}
                      to={`/admin/educacao/edit/${resource.id}`}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(resource.id)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar este recurso? Esta ação não pode ser desfeita.
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

