import { Box, Dialog, DialogActions, DialogContent, Drawer, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import IndiceDoQuiz from '../components/quiz/IndiceDoQuiz'
import QuestaoDoQuiz from '../components/quiz/QuestaoDoQuiz'
import DetailPageSkeleton from '../components/design/DetailPageSkeleton'
import ErroAoCarregar from '../components/design/ErroAoCarregar'
import EspinhaDoCurso from '../components/design/EspinhaDoCurso'
import { useProgressoDeCurso } from '../components/design/useProgressoDeCurso'
import { cursosApi } from '../services/api'
import type { CursoComArvore, QuizComVizinhas } from '../types'
import { atividadesDoModulo, hrefDaAtividade } from '../utils/atividadesDeCurso'
import { corrigirQuiz, type CorrecaoDoQuiz } from '../utils/correcaoDeQuiz'
import { contarAtividadesConcluidas } from '../utils/progressoDeCurso'

export default function Quiz() {
  const { cursoSlug, quizSlug } = useParams<{ cursoSlug: string; quizSlug: string }>()
  const tema = useTheme()
  const noCelular = useMediaQuery(tema.breakpoints.down('md'))
  const [dados, setDados] = useState<QuizComVizinhas | null>(null)
  const [arvore, setArvore] = useState<CursoComArvore | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [recarregar, setRecarregar] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [indice, setIndice] = useState(0)
  const [confirmando, setConfirmando] = useState(false)
  const [correcao, setCorrecao] = useState<CorrecaoDoQuiz | null>(null)
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const tituloDaQuestao = useRef<HTMLHeadingElement>(null)
  const tituloDoResultado = useRef<HTMLHeadingElement>(null)
  const {
    progresso,
    concluida,
    temProgresso,
    zerar,
    registrarResultado,
    visitarAtividade,
    notaDoQuiz,
    tentativasDoQuiz,
    quizEstaConcluido,
  } = useProgressoDeCurso()

  useEffect(() => {
    if (!cursoSlug || !quizSlug) return
    let cancelado = false
    setCarregando(true)
    setFalhou(false)

    cursosApi
      .getQuiz(cursoSlug, quizSlug)
      .then((resposta) => {
        if (!cancelado) setDados(resposta)
      })
      .catch((erro) => {
        if (cancelado) return
        if (import.meta.env.DEV) console.error('Erro ao carregar quiz:', erro)
        setDados(null)
        setFalhou(true)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    cursosApi
      .getBySlug(cursoSlug)
      .then((curso) => {
        if (!cancelado) setArvore(curso)
      })
      .catch(() => {
        if (!cancelado) setArvore(null)
      })

    return () => {
      cancelado = true
    }
  }, [cursoSlug, quizSlug, recarregar])

  useEffect(() => {
    if (cursoSlug && quizSlug && dados) {
      visitarAtividade(cursoSlug, { tipo: 'quiz', slug: quizSlug })
    }
  }, [cursoSlug, quizSlug, dados, visitarAtividade])

  useEffect(() => {
    if (!carregando && dados) tituloDaQuestao.current?.focus()
  }, [indice, carregando, dados])

  useEffect(() => {
    if (correcao) tituloDoResultado.current?.focus()
  }, [correcao])

  const respondidas = useMemo(() => new Set(Object.keys(respostas)), [respostas])
  const atividades = useMemo(
    () => (arvore ? arvore.modulos.flatMap(atividadesDoModulo) : []),
    [arvore],
  )

  if (carregando) return <DetailPageSkeleton withHeroImage={false} />
  if (falhou || !dados || !cursoSlug || !quizSlug) {
    return <ErroAoCarregar aoTentarDeNovo={() => setRecarregar((valor) => valor + 1)} />
  }

  const { quiz, curso, modulo } = dados
  const questao = quiz.questoes[indice]
  if (!questao) {
    return <ErroAoCarregar aoTentarDeNovo={() => setRecarregar((valor) => valor + 1)} />
  }

  const lacunas = quiz.questoes.length - respondidas.size
  const notaAnterior = notaDoQuiz(cursoSlug, quizSlug)
  const melhor = Math.max(notaAnterior ?? 0, correcao?.nota ?? 0)
  const tentativas = tentativasDoQuiz(cursoSlug, quizSlug)
  const concluido =
    melhor >= quiz.nota_minima || quizEstaConcluido(cursoSlug, quizSlug, quiz.nota_minima)
  const resultadoDaQuestao =
    correcao?.porQuestao.find((item) => item.questaoId === questao.id) ?? null

  const irPara = (proximoIndice: number) => {
    setIndice(Math.min(Math.max(proximoIndice, 0), quiz.questoes.length - 1))
  }

  const submeter = () => {
    const resultado = corrigirQuiz(quiz.questoes, respostas)
    setConfirmando(false)
    setCorrecao(resultado)
    registrarResultado(cursoSlug, quizSlug, resultado.nota)
  }

  const finalizar = () => {
    if (lacunas > 0) setConfirmando(true)
    else submeter()
  }

  const tentarNovamente = () => {
    setRespostas({})
    setIndice(0)
    setCorrecao(null)
  }

  const feitas = contarAtividadesConcluidas(progresso, cursoSlug, atividades)
  const totalDeAtividades = atividades.filter(
    (atividade) => atividade.tipo === 'quiz' || !atividade.opcional,
  ).length
  const espinha = arvore ? (
    <EspinhaDoCurso
      curso={arvore}
      atividadeAtual={{ tipo: 'quiz', slug: quizSlug }}
      feitas={feitas}
      total={totalDeAtividades}
      aulaConcluida={(slug) => concluida(cursoSlug, slug)}
      notaDoQuiz={(slug) => notaDoQuiz(cursoSlug, slug)}
      quizConcluido={(slug, notaMinima) => quizEstaConcluido(cursoSlug, slug, notaMinima)}
      podeZerar={temProgresso(cursoSlug)}
      aoZerar={() => zerar(cursoSlug)}
      aoNavegar={() => setGavetaAberta(false)}
    />
  ) : null

  const conteudo = (
    <Box sx={{ maxWidth: 920, mx: 'auto' }}>
      <Typography
        component={RouterLink}
        to={`/cursos/${curso.slug}`}
        sx={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 14 }}
      >
        {curso.titulo} / {modulo.titulo}
      </Typography>
      {noCelular && espinha && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setGavetaAberta(true)}
          style={{ marginTop: 12 }}
        >
          Atividades
        </button>
      )}

      <Box sx={{ mt: 2, pb: 3, borderBottom: '1px solid var(--color-line)' }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: 'var(--font-heading)',
            fontSize: { xs: 38, md: 56 },
            lineHeight: 1,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--color-text)',
          }}
        >
          {quiz.titulo}
        </Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap gap={{ xs: 1.5, md: 3 }} sx={{ mt: 2 }}>
          <Typography sx={{ color: 'var(--color-text-muted)' }}>{quiz.questoes.length} questões</Typography>
          <Typography sx={{ color: 'var(--color-text-muted)' }}>
            Mínimo: {quiz.nota_minima}%
          </Typography>
          <Typography sx={{ color: 'var(--color-text-muted)' }}>
            Melhor nota: {melhor}%
          </Typography>
        </Stack>
      </Box>

      {correcao && (
        <Box sx={{ py: 3, borderBottom: '1px solid var(--color-line)' }}>
          <Typography
            ref={tituloDoResultado}
            component="h2"
            tabIndex={-1}
            sx={{
              fontFamily: 'var(--font-heading)',
              fontSize: { xs: 48, md: 72 },
              lineHeight: 1,
              color: concluido ? 'var(--color-accent)' : 'var(--color-text)',
            }}
          >
            {correcao.nota}%
          </Typography>
          <Typography sx={{ mt: 1, color: 'var(--color-text-muted)' }}>
            {correcao.acertos} de {correcao.total} corretas. Melhor nota: {melhor}%. Tentativas:{' '}
            {tentativas}.
          </Typography>
        </Box>
      )}

      <Box sx={{ py: 3, borderBottom: '1px solid var(--color-line)' }}>
        <IndiceDoQuiz
          questoes={quiz.questoes}
          atual={indice}
          respondidas={respondidas}
          correcao={correcao}
          aoSelecionar={irPara}
        />
        <Typography sx={{ mt: 1, fontSize: 13, color: 'var(--color-text-faint)' }}>
          {respondidas.size} de {quiz.questoes.length} respondidas
        </Typography>
      </Box>

      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <QuestaoDoQuiz
          questao={questao}
          numero={indice + 1}
          resposta={respostas[questao.id]}
          correcao={resultadoDaQuestao}
          tituloRef={tituloDaQuestao}
          aoResponder={(alternativaId) =>
            setRespostas((atuais) => ({ ...atuais, [questao.id]: alternativaId }))
          }
        />
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ pt: 3, borderTop: '1px solid var(--color-line)' }}
      >
        <Stack direction="row" gap={1}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={indice === 0}
            onClick={() => irPara(indice - 1)}
          >
            Questão anterior
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={indice === quiz.questoes.length - 1}
            onClick={() => irPara(indice + 1)}
          >
            Próxima questão
          </button>
        </Stack>

        {correcao ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <button type="button" className="btn btn-secondary" onClick={tentarNovamente}>
              Tentar novamente
            </button>
            {dados.proxima && (
              <RouterLink
                className="btn btn-primary"
                to={hrefDaAtividade(curso.slug, dados.proxima)}
                style={{ textDecoration: 'none' }}
              >
                {dados.proxima.tipo === 'quiz' ? 'Próximo quiz' : 'Próxima aula'}
              </RouterLink>
            )}
          </Stack>
        ) : (
          <button type="button" className="btn btn-primary" onClick={finalizar}>
            Finalizar tentativa
          </button>
        )}
      </Stack>

      <Dialog
        open={confirmando}
        onClose={() => setConfirmando(false)}
        PaperProps={{ sx: { borderRadius: 0, border: '1px solid var(--color-line)', maxWidth: 480 } }}
      >
        <DialogContent>
          <Typography
            component="h2"
            sx={{ fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 600 }}
          >
            Finalizar agora?
          </Typography>
          <Typography sx={{ mt: 1.5 }}>
            {lacunas} {lacunas === 1 ? 'questão sem resposta contará' : 'questões sem resposta contarão'} como errada{lacunas === 1 ? '' : 's'}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmando(false)}>
            Voltar ao quiz
          </button>
          <button type="button" className="btn btn-primary" onClick={submeter}>
            Finalizar mesmo assim
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  )

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' } }}>
      {!noCelular && espinha && (
        <Box
          component="aside"
          sx={{
            borderRight: '1px solid var(--color-line)',
            position: 'sticky',
            top: 88,
            alignSelf: 'start',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          {espinha}
        </Box>
      )}
      {noCelular && (
        <Drawer anchor="left" open={gavetaAberta} onClose={() => setGavetaAberta(false)}>
          <Box sx={{ width: 'min(340px, 88vw)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: '12px', px: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setGavetaAberta(false)}>
                Fechar
              </button>
            </Box>
            {espinha}
          </Box>
        </Drawer>
      )}
      <Box sx={{ pl: { md: 4 }, minWidth: 0 }}>{conteudo}</Box>
    </Box>
  )
}
