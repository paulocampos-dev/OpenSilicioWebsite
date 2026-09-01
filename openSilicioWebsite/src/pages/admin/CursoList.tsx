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
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { cursosApi } from '../../services/api';
import type { CursoNaListagem } from '../../types';
import { duracaoPorExtenso } from '../../utils/duracao';

export default function CursoList() {
  const [cursos, setCursos] = useState<CursoNaListagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [paraApagar, setParaApagar] = useState<CursoNaListagem | null>(null);
  const [confirmacao, setConfirmacao] = useState('');
  const [aviso, setAviso] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      const resposta = await cursosApi.getAll(undefined, 1, 100);
      setCursos(resposta.data);
    } catch (erro) {
      console.error('Erro ao carregar cursos:', erro);
    } finally {
      setCarregando(false);
    }
  };

  const fecharDialogo = () => {
    setParaApagar(null);
    setConfirmacao('');
  };

  const apagar = async () => {
    if (!paraApagar) return;

    try {
      await cursosApi.delete(paraApagar.id);
      await carregar();
      setAviso({ open: true, message: 'Curso deletado com sucesso', severity: 'success' });
    } catch (erro) {
      console.error('Erro ao deletar curso:', erro);
      setAviso({ open: true, message: 'Erro ao deletar curso', severity: 'error' });
    } finally {
      fecharDialogo();
    }
  };

  if (carregando) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Cursos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/admin/cursos/novo">
          Novo curso
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Nível</TableCell>
              <TableCell>Estrutura</TableCell>
              <TableCell>Duração</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cursos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 2, textAlign: 'center' }}>Nenhum curso ainda.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              cursos.map((curso) => (
                <TableRow key={curso.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{curso.titulo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      /cursos/{curso.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>{curso.nivel ?? ''}</TableCell>
                  <TableCell>
                    {curso.modulos} {curso.modulos === 1 ? 'módulo' : 'módulos'}, {curso.aulas}{' '}
                    {curso.aulas === 1 ? 'aula' : 'aulas'}
                    {curso.aulas_rascunho > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {curso.aulas_rascunho} em rascunho
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{duracaoPorExtenso(curso.duracao_seg)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={curso.publicado ? 'Publicado' : 'Rascunho'}
                      color={curso.publicado ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      component={RouterLink}
                      to={`/admin/cursos/${curso.slug}/estrutura`}
                      title="Editar a estrutura"
                    >
                      <AccountTreeIcon />
                    </IconButton>
                    <IconButton component={RouterLink} to={`/admin/cursos/editar/${curso.id}`} title="Editar o curso">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => setParaApagar(curso)} title="Deletar" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Apagar um curso derruba módulos e aulas pelo cascade, então o corpo de
          toda aula vai junto. Digitar o título é o que separa isso de um clique
          errado. */}
      <Dialog open={paraApagar !== null} onClose={fecharDialogo}>
        <DialogTitle>Deletar o curso?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Isto apaga <strong>{paraApagar?.titulo}</strong> com seus {paraApagar?.modulos} módulos e{' '}
            {(paraApagar?.aulas ?? 0) + (paraApagar?.aulas_rascunho ?? 0)} aulas, incluindo o texto de cada
            uma. Não há como desfazer.
          </DialogContentText>
          <DialogContentText sx={{ mb: 1 }}>
            Digite <strong>{paraApagar?.titulo}</strong> para confirmar:
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialogo}>Cancelar</Button>
          <Button onClick={apagar} color="error" disabled={confirmacao !== paraApagar?.titulo}>
            Deletar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={aviso.open}
        autoHideDuration={4000}
        onClose={() => setAviso({ ...aviso, open: false })}
      >
        <Alert severity={aviso.severity} onClose={() => setAviso({ ...aviso, open: false })}>
          {aviso.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
