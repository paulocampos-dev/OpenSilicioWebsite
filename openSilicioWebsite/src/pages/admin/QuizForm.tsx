import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cursosApi } from '../../services/api'
import type { CursoComArvore } from '../../types'
import { emSlug, emSlugDigitado } from '../../utils/slug'
import {
  novoRascunhoDeQuestao,
  paraPayload,
  quizExistenteParaFormulario,
  validarQuiz,
  type QuizDoFormulario,
  type QuestaoDoFormulario,
} from '../../utils/quizForm'

function novoFormulario(moduloId: string): QuizDoFormulario {
  return {
    titulo: '',
    slug: '',
    moduloId,
    posicao: { tipo: 'fim-do-modulo' },
    notaMinima: 70,
    publicado: false,
    questoes: [novoRascunhoDeQuestao()],
  }
}

function mensagemDaApi(erro: unknown): string {
  if (typeof erro !== 'object' || erro === null || !('response' in erro)) {
    return 'Erro ao salvar o quiz'
  }
  const resposta = erro.response
  if (typeof resposta !== 'object' || resposta === null || !('data' in resposta)) {
    return 'Erro ao salvar o quiz'
  }
  const dados = resposta.data
  if (typeof dados !== 'object' || dados === null) return 'Erro ao salvar o quiz'
  if ('error' in dados && typeof dados.error === 'string') return dados.error
  if ('message' in dados && typeof dados.message === 'string') return dados.message
  return 'Erro ao salvar o quiz'
}

export default function QuizForm() {
  const { cursoSlug, quizId } = useParams<{ cursoSlug: string; quizId: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const editando = quizId !== 'novo'
  const moduloDaUrl = params.get('modulo') ?? ''

  const [curso, setCurso] = useState<CursoComArvore | null>(null)
  const [quiz, setQuiz] = useState<QuizDoFormulario>(() => novoFormulario(moduloDaUrl))
  const [questaoSelecionada, setQuestaoSelecionada] = useState(quiz.questoes[0]!.id)
  const [slugTocado, setSlugTocado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarErros, setMostrarErros] = useState(false)
  const [aviso, setAviso] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (!cursoSlug) return
    let cancelado = false

    const carregar = async () => {
      try {
        const arvore = await cursosApi.getCompleto(cursoSlug)
        if (cancelado) return
        setCurso(arvore)

        if (editando && quizId) {
          const existente = await cursosApi.getQuizById(quizId)
          if (cancelado) return
          const formulario = quizExistenteParaFormulario(existente)
          setQuiz(formulario)
          setQuestaoSelecionada(formulario.questoes[0]?.id ?? '')
          setSlugTocado(true)
        } else {
          const moduloId = moduloDaUrl || arvore.modulos[0]?.id || ''
          const formulario = novoFormulario(moduloId)
          setQuiz(formulario)
          setQuestaoSelecionada(formulario.questoes[0]!.id)
        }
      } catch (erro) {
        console.error('Erro ao carregar o quiz:', erro)
        if (!cancelado) {
          setAviso({ open: true, message: 'Erro ao carregar o quiz', severity: 'error' })
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    void carregar()
    return () => {
      cancelado = true
    }
  }, [cursoSlug, editando, moduloDaUrl, quizId])

  const erros = useMemo(() => validarQuiz(quiz), [quiz])
  const temErros = Object.keys(erros).length > 0
  const atual = quiz.questoes.find((questao) => questao.id === questaoSelecionada) ?? null
  const moduloAtual = curso?.modulos.find((modulo) => modulo.id === quiz.moduloId)

  const definirTitulo = (titulo: string) => {
    setQuiz((anterior) => ({
      ...anterior,
      titulo,
      ...(slugTocado ? {} : { slug: emSlug(titulo) }),
    }))
  }

  const atualizarQuestao = (
    id: string,
    alteracao: (questao: QuestaoDoFormulario) => QuestaoDoFormulario,
  ) => {
    setQuiz((anterior) => ({
      ...anterior,
      questoes: anterior.questoes.map((questao) =>
        questao.id === id ? alteracao(questao) : questao,
      ),
    }))
  }

  const adicionarQuestao = () => {
    const nova = novoRascunhoDeQuestao()
    setQuiz((anterior) => ({ ...anterior, questoes: [...anterior.questoes, nova] }))
    setQuestaoSelecionada(nova.id)
  }

  const moverQuestao = (indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao
    if (destino < 0 || destino >= quiz.questoes.length) return
    setQuiz((anterior) => {
      const questoes = [...anterior.questoes]
      const [movida] = questoes.splice(indice, 1)
      questoes.splice(destino, 0, movida!)
      return { ...anterior, questoes }
    })
  }

  const excluirQuestao = (indice: number) => {
    const questao = quiz.questoes[indice]
    if (!questao) return
    const temConteudo =
      Boolean(questao.enunciado.trim() || questao.explicacao.trim()) ||
      questao.alternativas.some((alternativa) => alternativa.texto.trim())
    if (temConteudo && !window.confirm('Excluir esta questão e todas as alternativas dela?')) return

    const restantes = quiz.questoes.filter((item) => item.id !== questao.id)
    setQuiz((anterior) => ({ ...anterior, questoes: restantes }))
    if (questaoSelecionada === questao.id) {
      setQuestaoSelecionada(restantes[Math.min(indice, restantes.length - 1)]?.id ?? '')
    }
  }

  const salvar = async () => {
    if (!curso) return
    setMostrarErros(true)
    if (temErros) {
      setAviso({
        open: true,
        message: 'Revise os campos indicados antes de salvar',
        severity: 'error',
      })
      return
    }

    setSalvando(true)
    try {
      const payload = paraPayload(quiz)
      if (editando && quizId) {
        const salvo = await cursosApi.atualizarQuiz(quizId, payload)
        const formulario = quizExistenteParaFormulario(salvo)
        setQuiz(formulario)
        setQuestaoSelecionada((idAtual) =>
          formulario.questoes.some((questao) => questao.id === idAtual)
            ? idAtual
            : (formulario.questoes[0]?.id ?? ''),
        )
        setAviso({ open: true, message: 'Quiz salvo', severity: 'success' })
      } else {
        const criado = await cursosApi.criarQuiz(curso.id, quiz.moduloId, payload)
        setAviso({ open: true, message: 'Quiz criado', severity: 'success' })
        navigate(`/admin/cursos/${curso.slug}/quizzes/${criado.id}`, { replace: true })
      }
      setMostrarErros(false)
    } catch (erro) {
      console.error('Erro ao salvar o quiz:', erro)
      setAviso({ open: true, message: mensagemDaApi(erro), severity: 'error' })
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Typography>Carregando...</Typography>
  if (!curso) return <Typography>Curso não encontrado.</Typography>

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4">{editando ? 'Editar quiz' : 'Novo quiz'}</Typography>
          <Typography variant="body2" color="text.secondary">
            <RouterLink to={`/admin/cursos/${curso.slug}/estrutura`}>{curso.titulo}</RouterLink>
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={salvar}
          disabled={salvando}
          sx={{ minHeight: { xs: 48, md: 36 } }}
        >
          {salvando ? 'Salvando...' : quiz.publicado ? 'Salvar e publicar' : 'Salvar rascunho'}
        </Button>
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Título"
              required
              fullWidth
              value={quiz.titulo}
              onChange={(evento) => definirTitulo(evento.target.value)}
              error={mostrarErros && Boolean(erros.titulo)}
              helperText={mostrarErros ? erros.titulo : undefined}
            />
            <TextField
              label="Slug"
              required
              fullWidth
              value={quiz.slug}
              onChange={(evento) => {
                setSlugTocado(true)
                setQuiz((anterior) => ({
                  ...anterior,
                  slug: emSlugDigitado(evento.target.value),
                }))
              }}
              error={mostrarErros && Boolean(erros.slug)}
              helperText={
                mostrarErros && erros.slug
                  ? erros.slug
                  : `/cursos/${curso.slug}/quizzes/${quiz.slug || '...'}`
              }
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Módulo"
              required
              fullWidth
              value={quiz.moduloId}
              onChange={(evento) =>
                setQuiz((anterior) => ({
                  ...anterior,
                  moduloId: evento.target.value,
                  posicao: { tipo: 'fim-do-modulo' },
                }))
              }
              error={mostrarErros && Boolean(erros.moduloId)}
              helperText={mostrarErros ? erros.moduloId : undefined}
            >
              {curso.modulos.map((modulo, indice) => (
                <MenuItem key={modulo.id} value={modulo.id}>
                  {indice + 1}. {modulo.titulo}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Posição"
              required
              fullWidth
              value={
                quiz.posicao.tipo === 'fim-do-modulo'
                  ? 'fim-do-modulo'
                  : `aula:${quiz.posicao.aulaId}`
              }
              onChange={(evento) =>
                setQuiz((anterior) => ({
                  ...anterior,
                  posicao:
                    evento.target.value === 'fim-do-modulo'
                      ? { tipo: 'fim-do-modulo' }
                      : {
                          tipo: 'depois-da-aula',
                          aulaId: evento.target.value.replace(/^aula:/, ''),
                        },
                }))
              }
              error={mostrarErros && Boolean(erros.posicao)}
              helperText={mostrarErros ? erros.posicao : undefined}
            >
              {(moduloAtual?.aulas ?? []).map((aula) => (
                <MenuItem key={aula.id} value={`aula:${aula.id}`}>
                  Depois de: {aula.titulo}
                </MenuItem>
              ))}
              <MenuItem value="fim-do-modulo">No fim do módulo</MenuItem>
            </TextField>

            <TextField
              label="Nota mínima (%)"
              type="number"
              value={quiz.notaMinima}
              onChange={(evento) =>
                setQuiz((anterior) => ({ ...anterior, notaMinima: Number(evento.target.value) }))
              }
              inputProps={{ min: 0, max: 100, step: 1 }}
              error={mostrarErros && Boolean(erros.notaMinima)}
              helperText={mostrarErros ? erros.notaMinima : undefined}
              sx={{ minWidth: 170 }}
            />
          </Stack>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={quiz.publicado}
                  disabled={!quiz.publicado && temErros}
                  onChange={(evento) =>
                    setQuiz((anterior) => ({ ...anterior, publicado: evento.target.checked }))
                  }
                />
              }
              label="Publicada"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Em rascunho, aparece como "em breve" e não entra no progresso. Cada quiz é publicado
              separadamente.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Paper sx={{ p: 1.5, position: { md: 'sticky' }, top: { md: 88 } }}>
          <Stack spacing={0.75}>
            {quiz.questoes.map((questao, indice) => (
              <Box
                key={questao.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 0.5,
                  border: '1px solid',
                  borderColor:
                    questao.id === questaoSelecionada ? 'primary.main' : 'divider',
                }}
              >
                <Button
                  aria-label={`Editar questão ${indice + 1}`}
                  onClick={() => setQuestaoSelecionada(questao.id)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', minWidth: 0 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline">Questão {indice + 1}</Typography>
                    <Typography variant="body2" noWrap color="text.primary">
                      {questao.enunciado || 'Sem enunciado'}
                    </Typography>
                  </Box>
                </Button>
                <Stack>
                  <IconButton
                    size="small"
                    aria-label={`Mover questão ${indice + 1} para cima`}
                    disabled={indice === 0}
                    onClick={() => moverQuestao(indice, -1)}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Mover questão ${indice + 1} para baixo`}
                    disabled={indice === quiz.questoes.length - 1}
                    onClick={() => moverQuestao(indice, 1)}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Excluir questão ${indice + 1}`}
                    onClick={() => excluirQuestao(indice)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            ))}

            {mostrarErros && erros.questoes && <Alert severity="error">{erros.questoes}</Alert>}
            <Button startIcon={<AddIcon />} onClick={adicionarQuestao}>
              Adicionar questão
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 3 }, minHeight: 420 }}>
          {atual ? (
            <Stack spacing={3}>
              <Typography variant="h5">
                Questão {quiz.questoes.findIndex((questao) => questao.id === atual.id) + 1}
              </Typography>
              <TextField
                label="Enunciado"
                required
                fullWidth
                multiline
                minRows={2}
                value={atual.enunciado}
                onChange={(evento) =>
                  atualizarQuestao(atual.id, (questao) => ({
                    ...questao,
                    enunciado: evento.target.value,
                  }))
                }
                error={mostrarErros && Boolean(erros[`questao:${atual.id}:enunciado`])}
                helperText={mostrarErros ? erros[`questao:${atual.id}:enunciado`] : undefined}
              />

              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Alternativas
                </Typography>
                {atual.alternativas.map((alternativa, indice) => (
                  <Stack key={alternativa.id} direction="row" spacing={1} alignItems="flex-start">
                    <Radio
                      checked={alternativa.correta}
                      inputProps={{
                        'aria-label': `Marcar alternativa ${indice + 1} como correta`,
                      }}
                      onChange={() =>
                        atualizarQuestao(atual.id, (questao) => ({
                          ...questao,
                          alternativas: questao.alternativas.map((item) => ({
                            ...item,
                            correta: item.id === alternativa.id,
                          })),
                        }))
                      }
                    />
                    <TextField
                      label={`Alternativa ${indice + 1}`}
                      required
                      fullWidth
                      value={alternativa.texto}
                      onChange={(evento) =>
                        atualizarQuestao(atual.id, (questao) => ({
                          ...questao,
                          alternativas: questao.alternativas.map((item) =>
                            item.id === alternativa.id
                              ? { ...item, texto: evento.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </Stack>
                ))}
                {mostrarErros && erros[`questao:${atual.id}:alternativas`] && (
                  <Alert severity="error">{erros[`questao:${atual.id}:alternativas`]}</Alert>
                )}
                {mostrarErros && erros[`questao:${atual.id}:correta`] && (
                  <Alert severity="error">{erros[`questao:${atual.id}:correta`]}</Alert>
                )}
              </Stack>

              <TextField
                label="Explicação"
                required
                fullWidth
                multiline
                minRows={3}
                value={atual.explicacao}
                onChange={(evento) =>
                  atualizarQuestao(atual.id, (questao) => ({
                    ...questao,
                    explicacao: evento.target.value,
                  }))
                }
                error={mostrarErros && Boolean(erros[`questao:${atual.id}:explicacao`])}
                helperText={
                  mostrarErros && erros[`questao:${atual.id}:explicacao`]
                    ? erros[`questao:${atual.id}:explicacao`]
                    : 'Mostrada depois da tentativa, acertando ou errando.'
                }
              />
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
              <Typography color="text.secondary">Adicione uma questão para começar.</Typography>
              <Button startIcon={<AddIcon />} onClick={adicionarQuestao}>
                Adicionar questão
              </Button>
            </Stack>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={aviso.open}
        autoHideDuration={5000}
        onClose={() => setAviso((anterior) => ({ ...anterior, open: false }))}
      >
        <Alert
          severity={aviso.severity}
          onClose={() => setAviso((anterior) => ({ ...anterior, open: false }))}
        >
          {aviso.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
