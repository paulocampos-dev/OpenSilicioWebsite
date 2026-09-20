import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuizComVizinhas } from '../types'
import Quiz from './Quiz'

const mocks = vi.hoisted(() => ({
  getQuiz: vi.fn(),
  getBySlug: vi.fn(),
  registrarResultado: vi.fn(),
  visitarAtividade: vi.fn(),
  notaDoQuiz: vi.fn(() => 80),
  tentativasDoQuiz: vi.fn(() => 2),
  quizEstaConcluido: vi.fn(() => true),
  concluida: vi.fn(() => false),
  temProgresso: vi.fn(() => false),
  zerar: vi.fn(),
}))

vi.mock('../services/api', () => ({
  cursosApi: { getQuiz: mocks.getQuiz, getBySlug: mocks.getBySlug },
}))
vi.mock('../components/design/useProgressoDeCurso', () => ({
  useProgressoDeCurso: () => ({
    progresso: {},
    concluida: mocks.concluida,
    temProgresso: mocks.temProgresso,
    zerar: mocks.zerar,
    registrarResultado: mocks.registrarResultado,
    visitarAtividade: mocks.visitarAtividade,
    notaDoQuiz: mocks.notaDoQuiz,
    tentativasDoQuiz: mocks.tentativasDoQuiz,
    quizEstaConcluido: mocks.quizEstaConcluido,
  }),
}))

const dados: QuizComVizinhas = {
  quiz: {
    id: 'quiz-1',
    curso_id: 'curso-1',
    modulo_id: 'modulo-1',
    aula_id: 'aula-1',
    ordem: 0,
    slug: 'revisao-celulas',
    titulo: 'Revisão de células padrão',
    nota_minima: 70,
    publicado: true,
    created_at: '2026-09-20T12:00:00.000Z',
    updated_at: '2026-09-20T12:00:00.000Z',
    questoes: Array.from({ length: 4 }, (_, indice) => ({
      id: `q${indice + 1}`,
      ordem: indice,
      enunciado: `Enunciado ${indice + 1}`,
      explicacao: `Explicação ${indice + 1}`,
      alternativas: Array.from({ length: 4 }, (_, alternativa) => ({
        id: `q${indice + 1}-a${alternativa + 1}`,
        ordem: alternativa,
        texto: `Q${indice + 1} alternativa ${alternativa + 1}`,
        correta: alternativa === 0,
      })),
    })),
  },
  curso: { id: 'curso-1', slug: 'projeto-digital', titulo: 'Projeto Digital' },
  modulo: { id: 'modulo-1', titulo: 'Células padrão', ordem: 1 },
  anterior: { tipo: 'aula', slug: 'simulando', titulo: 'Simulando uma célula' },
  proxima: { tipo: 'aula', slug: 'silwiz', titulo: 'Desenhando no SiliWiz' },
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/cursos/projeto-digital/quizzes/revisao-celulas']}>
      <Routes>
        <Route path="/cursos/:cursoSlug/quizzes/:quizSlug" element={<Quiz />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderizarComNavegacao() {
  const router = createMemoryRouter(
    [{ path: '/cursos/:cursoSlug/quizzes/:quizSlug', element: <Quiz /> }],
    { initialEntries: ['/cursos/projeto-digital/quizzes/revisao-celulas'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('Quiz público', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getQuiz.mockResolvedValue(dados)
    mocks.getBySlug.mockRejectedValue(new Error('espinha indisponível'))
    mocks.notaDoQuiz.mockReturnValue(80)
    mocks.tentativasDoQuiz.mockReturnValue(2)
    mocks.quizEstaConcluido.mockReturnValue(true)
  })

  it('mostra a primeira pergunta e quatro alternativas', async () => {
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Enunciado 1' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('preserva uma resposta ao navegar entre perguntas', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(await screen.findByLabelText('Q1 alternativa 2'))
    await usuario.click(screen.getByRole('button', { name: 'Próxima questão' }))
    await usuario.click(screen.getByRole('button', { name: 'Questão anterior' }))

    expect(screen.getByLabelText('Q1 alternativa 2')).toBeChecked()
  })

  it('confirma a quantidade exata de lacunas e permite voltar sem registrar', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findByRole('heading', { name: 'Enunciado 1' })
    await usuario.click(screen.getByRole('button', { name: 'Finalizar tentativa' }))

    const dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByText('4 questões sem resposta contarão como erradas.')).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Voltar ao quiz' }))
    expect(mocks.registrarResultado).not.toHaveBeenCalled()
  })

  it('corrige, mostra a explicação e registra uma única tentativa', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(await screen.findByLabelText('Q1 alternativa 1'))
    await usuario.click(screen.getByRole('button', { name: 'Finalizar tentativa' }))
    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Finalizar mesmo assim' }),
    )

    expect(await screen.findByRole('heading', { name: '25%' })).toBeInTheDocument()
    expect(screen.getByText('Explicação 1')).toBeInTheDocument()
    expect(mocks.registrarResultado).toHaveBeenCalledOnce()
    expect(mocks.registrarResultado).toHaveBeenCalledWith('projeto-digital', 'revisao-celulas', 25)
  })

  it('limpa as respostas ao tentar novamente e mantém a melhor nota', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(await screen.findByLabelText('Q1 alternativa 1'))
    await usuario.click(screen.getByRole('button', { name: 'Finalizar tentativa' }))
    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Finalizar mesmo assim' }),
    )
    await usuario.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(screen.getByLabelText('Q1 alternativa 1')).not.toBeChecked()
    expect(screen.getByText('Melhor nota: 80%')).toBeInTheDocument()
  })

  it('inicia uma tentativa limpa ao navegar para outro quiz antes de corrigir', async () => {
    const usuario = userEvent.setup()
    const quizCurto: QuizComVizinhas = {
      ...dados,
      quiz: {
        ...dados.quiz,
        id: 'quiz-2',
        slug: 'quiz-curto',
        titulo: 'Quiz curto',
        questoes: [
          {
            id: 'curta-1',
            ordem: 0,
            enunciado: 'Pergunta curta',
            explicacao: 'Explicação curta',
            alternativas: dados.quiz.questoes[0]!.alternativas.map((alternativa) => ({
              ...alternativa,
              id: `curta-${alternativa.id}`,
            })),
          },
        ],
      },
    }
    mocks.getQuiz.mockImplementation((_cursoSlug: string, quizSlug: string) =>
      Promise.resolve(quizSlug === 'quiz-curto' ? quizCurto : dados),
    )
    const router = renderizarComNavegacao()

    await usuario.click(await screen.findByLabelText('Q1 alternativa 2'))
    await usuario.click(screen.getByRole('button', { name: 'Próxima questão' }))
    await act(() => router.navigate('/cursos/projeto-digital/quizzes/quiz-curto'))

    expect(await screen.findByRole('heading', { name: 'Pergunta curta' })).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar. Tente de novo em alguns minutos.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true)
  })

  it('remove o resultado anterior ao navegar para outro quiz', async () => {
    const usuario = userEvent.setup()
    const segundoQuiz: QuizComVizinhas = {
      ...dados,
      quiz: {
        ...dados.quiz,
        id: 'quiz-2',
        slug: 'segundo-quiz',
        titulo: 'Segundo quiz',
        questoes: dados.quiz.questoes.map((questao) => ({
          ...questao,
          id: `segundo-${questao.id}`,
          enunciado: `Segundo ${questao.enunciado}`,
          alternativas: questao.alternativas.map((alternativa) => ({
            ...alternativa,
            id: `segundo-${alternativa.id}`,
          })),
        })),
      },
    }
    mocks.getQuiz.mockImplementation((_cursoSlug: string, quizSlug: string) =>
      Promise.resolve(quizSlug === 'segundo-quiz' ? segundoQuiz : dados),
    )
    const router = renderizarComNavegacao()

    await usuario.click(await screen.findByLabelText('Q1 alternativa 1'))
    await usuario.click(screen.getByRole('button', { name: 'Finalizar tentativa' }))
    await usuario.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Finalizar mesmo assim' }),
    )
    expect(await screen.findByRole('heading', { name: '25%' })).toBeInTheDocument()

    await act(() => router.navigate('/cursos/projeto-digital/quizzes/segundo-quiz'))

    expect(await screen.findByRole('heading', { name: 'Segundo Enunciado 1' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '25%' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true)
  })

  it('mostra erro de carga e tenta novamente', async () => {
    const usuario = userEvent.setup()
    mocks.getQuiz.mockRejectedValueOnce(new Error('fora do ar')).mockResolvedValueOnce(dados)
    renderizar()

    expect(await screen.findByText('Não foi possível carregar. Tente de novo em alguns minutos.')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('heading', { name: 'Enunciado 1' })).toBeInTheDocument()
    await waitFor(() => expect(mocks.getQuiz).toHaveBeenCalledTimes(2))
  })
})
