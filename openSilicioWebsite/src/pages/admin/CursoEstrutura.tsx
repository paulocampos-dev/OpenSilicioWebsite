import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { cursosApi } from '../../services/api';
import type { CursoComArvore } from '../../types';
import { duracaoPorExtenso } from '../../utils/duracao';

/** Troca dois itens de lugar e devolve a lista nova. */
const trocar = <T,>(lista: T[], de: number, para: number): T[] => {
  if (para < 0 || para >= lista.length) return lista;
  const copia = [...lista];
  const [movido] = copia.splice(de, 1);
  copia.splice(para, 0, movido!);
  return copia;
};

export default function CursoEstrutura() {
  const { cursoSlug } = useParams<{ cursoSlug: string }>();
  const [curso, setCurso] = useState<CursoComArvore | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [dialogoModulo, setDialogoModulo] = useState<{ id?: string; titulo: string; resumo: string } | null>(null);
  const [aviso, setAviso] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const carregar = useCallback(async () => {
    if (!cursoSlug) return;
    try {
      // A rota "completo" traz os rascunhos, que é justamente o que se edita aqui.
      setCurso(await cursosApi.getCompleto(cursoSlug));
    } catch (erro) {
      console.error('Erro ao carregar a estrutura:', erro);
    } finally {
      setCarregando(false);
    }
  }, [cursoSlug]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const falhar = (mensagem: string) => (erro: unknown) => {
    console.error(mensagem, erro);
    setAviso({ open: true, message: mensagem, severity: 'error' });
  };

  const salvarModulo = async () => {
    if (!dialogoModulo || !curso) return;

    try {
      if (dialogoModulo.id) {
        await cursosApi.atualizarModulo(dialogoModulo.id, {
          titulo: dialogoModulo.titulo,
          resumo: dialogoModulo.resumo || null,
        });
      } else {
        await cursosApi.criarModulo(curso.id, {
          titulo: dialogoModulo.titulo,
          resumo: dialogoModulo.resumo || null,
        });
      }
      setDialogoModulo(null);
      await carregar();
    } catch (erro) {
      falhar('Erro ao salvar o módulo')(erro);
    }
  };

  const apagarModulo = async (id: string, titulo: string, quantasAulas: number) => {
    const confirmado = window.confirm(
      quantasAulas > 0
        ? `Apagar o módulo "${titulo}" também apaga suas ${quantasAulas} aulas e o texto delas. Continuar?`
        : `Apagar o módulo "${titulo}"?`,
    );
    if (!confirmado) return;

    try {
      await cursosApi.deletarModulo(id);
      await carregar();
    } catch (erro) {
      falhar('Erro ao deletar o módulo')(erro);
    }
  };

  const moverModulo = async (indice: number, direcao: -1 | 1) => {
    if (!curso) return;
    const nova = trocar(curso.modulos, indice, indice + direcao);
    if (nova === curso.modulos) return;

    setCurso({ ...curso, modulos: nova });
    try {
      await cursosApi.reordenarModulos(curso.id, nova.map((m) => m.id));
    } catch (erro) {
      falhar('Erro ao reordenar os módulos')(erro);
      await carregar();
    }
  };

  const moverAula = async (moduloId: string, indice: number, direcao: -1 | 1) => {
    if (!curso) return;
    const modulo = curso.modulos.find((m) => m.id === moduloId);
    if (!modulo) return;

    const nova = trocar(modulo.aulas, indice, indice + direcao);
    if (nova === modulo.aulas) return;

    setCurso({
      ...curso,
      modulos: curso.modulos.map((m) => (m.id === moduloId ? { ...m, aulas: nova } : m)),
    });
    try {
      await cursosApi.reordenarAulas(moduloId, nova.map((a) => a.id));
    } catch (erro) {
      falhar('Erro ao reordenar as aulas')(erro);
      await carregar();
    }
  };

  const apagarAula = async (id: string, titulo: string) => {
    if (!window.confirm(`Apagar a aula "${titulo}" e todo o texto dela?`)) return;

    try {
      await cursosApi.deletarAula(id);
      await carregar();
    } catch (erro) {
      falhar('Erro ao deletar a aula')(erro);
    }
  };

  if (carregando) return <Typography>Carregando...</Typography>;
  if (!curso) return <Typography>Curso não encontrado.</Typography>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h4">{curso.titulo}</Typography>
          <Typography variant="body2" color="text.secondary">
            {curso.modulos.length} {curso.modulos.length === 1 ? 'módulo' : 'módulos'}, {curso.total_aulas}{' '}
            {curso.total_aulas === 1 ? 'aula publicada' : 'aulas publicadas'}
            {curso.duracao_seg > 0 ? `, ${duracaoPorExtenso(curso.duracao_seg)}` : ''}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to={`/admin/cursos/editar/${curso.id}`}>
            Dados do curso
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setDialogoModulo({ titulo: '', resumo: '' })}
          >
            Novo módulo
          </Button>
        </Stack>
      </Stack>

      {curso.modulos.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Comece criando um módulo. As aulas ficam dentro dele.
          </Typography>
        </Paper>
      )}

      <Stack spacing={2} sx={{ mt: 2 }}>
        {curso.modulos.map((modulo, indiceModulo) => (
          <Paper key={modulo.id} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="overline" color="primary">
                  Módulo {indiceModulo + 1}
                </Typography>
                <Typography variant="h6">{modulo.titulo}</Typography>
                {modulo.resumo && (
                  <Typography variant="body2" color="text.secondary">
                    {modulo.resumo}
                  </Typography>
                )}
              </Box>
              <IconButton
                size="small"
                disabled={indiceModulo === 0}
                onClick={() => moverModulo(indiceModulo, -1)}
                title="Subir"
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                disabled={indiceModulo === curso.modulos.length - 1}
                onClick={() => moverModulo(indiceModulo, 1)}
                title="Descer"
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDialogoModulo({ id: modulo.id, titulo: modulo.titulo, resumo: modulo.resumo ?? '' })}
                title="Renomear"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => apagarModulo(modulo.id, modulo.titulo, modulo.aulas.length)}
                title="Deletar"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Stack spacing={0.5} sx={{ mt: 2 }}>
              {modulo.aulas.map((aula, indiceAula) => (
                <Stack
                  key={aula.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Typography sx={{ flex: 1, minWidth: 0 }}>
                    {aula.titulo}
                    {aula.publicado && aula.duracao_seg ? (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {' '}
                        · {duracaoPorExtenso(aula.duracao_seg)}
                      </Typography>
                    ) : null}
                  </Typography>
                  <Chip
                    size="small"
                    label={aula.publicado ? 'Publicada' : 'Rascunho'}
                    color={aula.publicado ? 'success' : 'default'}
                  />
                  <IconButton
                    size="small"
                    disabled={indiceAula === 0}
                    onClick={() => moverAula(modulo.id, indiceAula, -1)}
                    title="Subir"
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={indiceAula === modulo.aulas.length - 1}
                    onClick={() => moverAula(modulo.id, indiceAula, 1)}
                    title="Descer"
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    component={RouterLink}
                    to={`/admin/cursos/${curso.slug}/aulas/${aula.id}`}
                    title="Editar"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => apagarAula(aula.id, aula.titulo)}
                    title="Deletar"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}

              <Box sx={{ pt: 1 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to={`/admin/cursos/${curso.slug}/aulas/nova?modulo=${modulo.id}`}
                >
                  Nova aula
                </Button>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={dialogoModulo !== null} onClose={() => setDialogoModulo(null)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogoModulo?.id ? 'Editar módulo' : 'Novo módulo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              fullWidth
              autoFocus
              value={dialogoModulo?.titulo ?? ''}
              onChange={(e) => setDialogoModulo((d) => (d ? { ...d, titulo: e.target.value } : d))}
            />
            <TextField
              label="Resumo"
              fullWidth
              multiline
              rows={2}
              value={dialogoModulo?.resumo ?? ''}
              onChange={(e) => setDialogoModulo((d) => (d ? { ...d, resumo: e.target.value } : d))}
              helperText="Opcional, aparece abaixo do título do módulo no currículo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoModulo(null)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarModulo} disabled={!dialogoModulo?.titulo.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={aviso.open} autoHideDuration={4000} onClose={() => setAviso({ ...aviso, open: false })}>
        <Alert severity={aviso.severity} onClose={() => setAviso({ ...aviso, open: false })}>
          {aviso.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
