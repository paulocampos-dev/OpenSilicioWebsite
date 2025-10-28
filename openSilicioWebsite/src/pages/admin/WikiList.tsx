import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import PublishIcon from '@mui/icons-material/Publish';
import { wikiApi } from '../../services/api'
import type { WikiEntry, PendingWikiLinkGrouped } from '../../types';

export default function WikiList() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [pendingLinks, setPendingLinks] = useState<PendingWikiLinkGrouped[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    loadEntries();
    loadPendingLinks();
  }, []);

  const loadEntries = async () => {
    try {
      // Load all entries (published and unpublished) for admin with high limit
      const response = await wikiApi.getAll(undefined, 1, 100);
      setEntries(response.data);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingLinks = async () => {
    try {
      const data = await wikiApi.getPendingLinks(1, 100, true);
      setPendingLinks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar links pendentes:', error);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta entrada?')) {
      return;
    }

    try {
      await wikiApi.delete(id);
      loadEntries();
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
      alert('Erro ao deletar entrada');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await wikiApi.update(id, { published: true });
      loadEntries();
    } catch (error) {
      console.error('Erro ao publicar entrada:', error);
      alert('Erro ao publicar entrada');
    }
  };

  const handleCreateFromPending = (term: string) => {
    // Navigate to the new wiki entry form with the term pre-filled
    navigate('/admin/wiki/new', { state: { pendingTerm: term } });
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          Entradas da Wiki
        </Typography>
        <Button
          component={RouterLink}
          to="/admin/wiki/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nova Entrada
        </Button>
      </Box>

      {/* Pending Links Section */}
      {loadingPending ? null : pendingLinks.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkAddIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Links Pendentes ({pendingLinks.length})
              </Typography>
            </Box>
            <Alert severity="info">
              Estes termos foram marcados em posts e recursos educacionais, mas ainda não têm uma entrada na wiki.
            </Alert>
            <Divider />
            <Stack spacing={1}>
              {pendingLinks.map((pending) => (
                <Box
                  key={pending.term}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {pending.term}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Usado {pending.count} {pending.count === 1 ? 'vez' : 'vezes'}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleCreateFromPending(pending.term)}
                  >
                    Criar Entrada
                  </Button>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Termo</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Definição</TableCell>
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
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhuma entrada encontrada
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.term}</TableCell>
                  <TableCell>{entry.slug}</TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.definition}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.published ? 'Publicado' : 'Rascunho'}
                      color={entry.published ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">
                    {!entry.published && (
                      <IconButton
                        onClick={() => handlePublish(entry.id)}
                        size="small"
                        color="success"
                        title="Publicar"
                      >
                        <PublishIcon />
                      </IconButton>
                    )}
                    <IconButton
                      component={RouterLink}
                      to={`/admin/wiki/edit/${entry.id}`}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(entry.id)}
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
    </Stack>
  );
}

