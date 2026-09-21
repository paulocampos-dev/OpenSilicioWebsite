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
  MenuItem,
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
import PublishIcon from '@mui/icons-material/Publish';
import { cursosApi } from '../../services/api';
import type { AulaNaArvore, CursoComArvore, ModuloNaArvore, QuizNaArvore } from '../../types';
import { duracaoPorExtenso } from '../../utils/duracao';
import AdminMobileItem from '../../components/admin/AdminMobileItem';

/** Troca dois itens de lugar e devolve a lista nova. */
const trocar = <T,>(lista: T[], de: number, para: number): T[] => {
  if (para < 0 || para >= lista.length) return lista;
  const copia = [...lista];
  const [movido] = copia.splice(de, 1);
  copia.splice(para, 0, movido!);
  return copia;
};

type AtividadeDoAdmin =
  | { tipo: 'aula'; item: AulaNaArvore; indiceAula: number }
  | { tipo: 'quiz'; item: QuizNaArvore; posicao: string };

/** Intercala cada quiz depois da aula escolhida e deixa a revisão no final. */
const atividadesDoModulo = (modulo: ModuloNaArvore): AtividadeDoAdmin[] => {
  const atividades: AtividadeDoAdmin[] = [];
  const quizzesAdicionados = new Set<string>();

  for (const [indiceAula, aula] of modulo.aulas.entries()) {
    atividades.push({ tipo: 'aula', item: aula, indiceAula });
    for (const quiz of modulo.quizzes) {
      if (quiz.aula_id === aula.id) {
        atividades.push({ tipo: 'quiz', item: quiz, posicao: `Depois de ${aula.titulo}` });
        quizzesAdicionados.add(quiz.id);
      }
    }
  }

  for (const quiz of modulo.quizzes) {
    if (quizzesAdicionados.has(quiz.id)) continue;
    atividades.push({
      tipo: 'quiz',
      item: quiz,
      posicao: quiz.aula_id === null ? 'Fim do módulo' : 'Posição indisponível',
    });
  }

  return atividades;
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

  const falhar = (mensagem: string, erro: unknown) => {
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
      falhar('Erro ao salvar o módulo', erro);
    }
  };

  const publicarModulo = async (id: string) => {
    try {
      const publicadas = await cursosApi.publicarModulo(id);
      setAviso({
        open: true,
        message: `${publicadas} ${publicadas === 1 ? 'aula publicada' : 'aulas publicadas'}`,
        severity: 'success',
      });
      await carregar();
    } catch (erro) {
      falhar('Erro ao publicar o módulo', erro);
    }
  };

  /**
   * O corpo leva só `publicado`: a atualização do curso é parcial, e mandar o
   * resto do que a árvore tem na mão sobrescreveria com dados antigos o que o
   * formulário "Dados do curso" tiver gravado nesse meio tempo.
   */
  const alternarPublicacaoDoCurso = async () => {
    if (!curso) return;

    try {
      await cursosApi.update(curso.id, { publicado: !curso.publicado });
      setAviso({
        open: true,
        message: curso.publicado ? 'Curso despublicado' : 'Curso publicado',
        severity: 'success',
      });
      await carregar();
    } catch (erro) {
      falhar('Erro ao mudar a publicação do curso', erro);
    }
  };

  const apagarModulo = async (id: string, titulo: string, quantasAulas: number, quantosQuizzes: number) => {
    const itens = [
      quantasAulas > 0 ? `${quantasAulas} ${quantasAulas === 1 ? 'aula' : 'aulas'}` : null,
      quantosQuizzes > 0 ? `${quantosQuizzes} ${quantosQuizzes === 1 ? 'quiz' : 'quizzes'}` : null,
    ].filter(Boolean).join(' e ');
    const confirmado = window.confirm(
      itens
        ? `Apagar o módulo "${titulo}" também apaga ${itens} e todo o conteúdo deles. Continuar?`
        : `Apagar o módulo "${titulo}"?`,
    );
    if (!confirmado) return;

    try {
      await cursosApi.deletarModulo(id);
      await carregar();
    } catch (erro) {
      falhar('Erro ao deletar o módulo', erro);
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
      falhar('Erro ao reordenar os módulos', erro);
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
      falhar('Erro ao reordenar as aulas', erro);
      await carregar();
    }
  };

  const apagarAula = async (id: string, titulo: string) => {
    if (!window.confirm(`Apagar a aula "${titulo}" e todo o texto dela?`)) return;

    try {
      await cursosApi.deletarAula(id);
      await carregar();
    } catch (erro) {
      falhar('Erro ao deletar a aula', erro);
    }
  };

  const apagarQuiz = async (id: string, titulo: string) => {
    if (!window.confirm(`Apagar o quiz "${titulo}" e todas as questões dele?`)) return;

    try {
      await cursosApi.deletarQuiz(id);
      await carregar();
    } catch (erro) {
      falhar('Erro ao deletar o quiz', erro);
    }
  };

  if (carregando) return <Typography>Carregando...</Typography>;
  if (!curso) return <Typography>Curso não encontrado.</Typography>;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 1 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h4">{curso.titulo}</Typography>
            <Chip
              size="small"
              label={curso.publicado ? 'Publicado' : 'Rascunho'}
              color={curso.publicado ? 'success' : 'default'}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {curso.modulos.length} {curso.modulos.length === 1 ? 'módulo' : 'módulos'}, {curso.total_aulas}{' '}
            {curso.total_aulas === 1 ? 'aula publicada' : 'aulas publicadas'}
            {curso.duracao_seg > 0 ? `, ${duracaoPorExtenso(curso.duracao_seg)}` : ''}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={(theme) => ({
            '& .MuiButton-root': { minHeight: 48 },
            [theme.breakpoints.up('sm')]: {
              '& .MuiButton-root': { minHeight: 0 },
            },
          })}
        >
          <Button component={RouterLink} to={`/admin/cursos/editar/${curso.id}`}>
            Dados do curso
          </Button>
          <Button variant="outlined" onClick={alternarPublicacaoDoCurso}>
            {curso.publicado ? 'Despublicar curso' : 'Publicar curso'}
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
            <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
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
              {modulo.aulas.some((aula) => !aula.publicado) && (
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => publicarModulo(modulo.id)}
                  title="Publicar módulo"
                >
                  <PublishIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  apagarModulo(modulo.id, modulo.titulo, modulo.aulas.length, modulo.quizzes.length)
                }
                title="Deletar"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <AdminMobileItem
                title={modulo.titulo}
                details={<>{`Módulo ${indiceModulo + 1}`}{modulo.resumo ? ` · ${modulo.resumo}` : ''}</>}
                actionsLabel={`Ações do módulo ${modulo.titulo}`}
                actions={(
                  <>
                    <MenuItem disabled={indiceModulo === 0} onClick={() => moverModulo(indiceModulo, -1)}>Mover módulo para cima</MenuItem>
                    <MenuItem disabled={indiceModulo === curso.modulos.length - 1} onClick={() => moverModulo(indiceModulo, 1)}>Mover módulo para baixo</MenuItem>
                    <MenuItem onClick={() => setDialogoModulo({ id: modulo.id, titulo: modulo.titulo, resumo: modulo.resumo ?? '' })}>Renomear módulo</MenuItem>
                    {modulo.aulas.some((aula) => !aula.publicado) && <MenuItem onClick={() => publicarModulo(modulo.id)}>Publicar módulo</MenuItem>}
                    <MenuItem onClick={() => apagarModulo(modulo.id, modulo.titulo, modulo.aulas.length, modulo.quizzes.length)} sx={{ color: 'error.main' }}>Deletar módulo</MenuItem>
                  </>
                )}
              />
            </Box>

            <Stack spacing={0.5} sx={{ mt: 2 }}>
              {atividadesDoModulo(modulo).map((atividade) => {
                if (atividade.tipo === 'aula') {
                  const aula = atividade.item;
                  const indiceAula = atividade.indiceAula;
                  return (
                    <Box key={`aula-${aula.id}`}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ py: 0.75, borderTop: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'flex' } }}
                    >
                      <Typography sx={{ flex: 1, minWidth: 0 }}>
                        {aula.titulo}
                        {aula.publicado && aula.duracao_seg ? (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}
                            · {duracaoPorExtenso(aula.duracao_seg)}
                          </Typography>
                        ) : null}
                        {aula.publicado && aula.opcional ? (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}
                            · opcional
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
                    <Box sx={{ display: { xs: 'block', md: 'none' }, borderTop: '1px solid', borderColor: 'divider', pt: 0.5 }}>
                      <AdminMobileItem
                        title={aula.titulo}
                        details={<>{aula.publicado && aula.duracao_seg ? duracaoPorExtenso(aula.duracao_seg) : 'Sem duração'}{aula.publicado && aula.opcional ? ' · opcional' : ''}</>}
                        status={<Chip size="small" label={aula.publicado ? 'Publicada' : 'Rascunho'} color={aula.publicado ? 'success' : 'default'} />}
                        actions={(
                          <>
                            <MenuItem disabled={indiceAula === 0} onClick={() => moverAula(modulo.id, indiceAula, -1)}>Mover aula para cima</MenuItem>
                            <MenuItem disabled={indiceAula === modulo.aulas.length - 1} onClick={() => moverAula(modulo.id, indiceAula, 1)}>Mover aula para baixo</MenuItem>
                            <MenuItem component={RouterLink} to={`/admin/cursos/${curso.slug}/aulas/${aula.id}`}>Editar aula</MenuItem>
                            <MenuItem onClick={() => apagarAula(aula.id, aula.titulo)} sx={{ color: 'error.main' }}>Deletar aula</MenuItem>
                          </>
                        )}
                      />
                    </Box>
                    </Box>
                  );
                }

                const quiz = atividade.item;
                return (
                  <Box key={`quiz-${quiz.id}`}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ py: 0.75, pl: 2, borderTop: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'flex' } }}
                  >
                    <Box sx={{ width: 22, textAlign: 'center', color: 'primary.main', fontWeight: 700 }}>
                      ?
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography>{quiz.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {quiz.total_questoes ?? 0}{' '}
                        {(quiz.total_questoes ?? 0) === 1 ? 'questão' : 'questões'} · mínimo{' '}
                        {quiz.nota_minima ?? 70}% · {atividade.posicao.toLocaleLowerCase('pt-BR')}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={quiz.publicado ? 'Publicado' : 'Rascunho'}
                      color={quiz.publicado ? 'success' : 'default'}
                    />
                    <IconButton
                      size="small"
                      component={RouterLink}
                      to={`/admin/cursos/${curso.slug}/quizzes/${quiz.id}`}
                      aria-label={`Editar quiz ${quiz.titulo}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => apagarQuiz(quiz.id, quiz.titulo)}
                      aria-label={`Deletar quiz ${quiz.titulo}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Box sx={{ display: { xs: 'block', md: 'none' }, borderTop: '1px solid', borderColor: 'divider', pt: 0.5 }}>
                    <AdminMobileItem
                      title={quiz.titulo}
                      details={<>{quiz.total_questoes ?? 0} {(quiz.total_questoes ?? 0) === 1 ? 'questão' : 'questões'} · mínimo {quiz.nota_minima ?? 70}% · {atividade.posicao.toLocaleLowerCase('pt-BR')}</>}
                      status={<Chip size="small" label={quiz.publicado ? 'Publicado' : 'Rascunho'} color={quiz.publicado ? 'success' : 'default'} />}
                      actions={(
                        <>
                          <MenuItem component={RouterLink} to={`/admin/cursos/${curso.slug}/quizzes/${quiz.id}`}>Editar quiz</MenuItem>
                          <MenuItem onClick={() => apagarQuiz(quiz.id, quiz.titulo)} sx={{ color: 'error.main' }}>Deletar quiz</MenuItem>
                        </>
                      )}
                    />
                  </Box>
                  </Box>
                );
              })}

              <Stack direction="row" spacing={1} sx={{ pt: 1, display: { xs: 'none', md: 'flex' } }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to={`/admin/cursos/${curso.slug}/aulas/nova?modulo=${modulo.id}`}
                >
                  Nova aula
                </Button>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to={`/admin/cursos/${curso.slug}/quizzes/novo?modulo=${modulo.id}`}
                >
                  Novo quiz
                </Button>
              </Stack>
              <Stack
                data-testid="mobile-create-actions"
                direction="row"
                spacing={1}
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  py: 1,
                  pb: 'max(8px, env(safe-area-inset-bottom))',
                  '& > *': { flex: 1, minHeight: 48 },
                }}
              >
                <Button startIcon={<AddIcon />} component={RouterLink} to={`/admin/cursos/${curso.slug}/aulas/nova?modulo=${modulo.id}`}>Nova aula</Button>
                <Button startIcon={<AddIcon />} component={RouterLink} to={`/admin/cursos/${curso.slug}/quizzes/novo?modulo=${modulo.id}`}>Novo quiz</Button>
              </Stack>
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
