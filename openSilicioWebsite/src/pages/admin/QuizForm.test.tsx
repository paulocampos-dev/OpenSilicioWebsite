import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cursosApi } from '../../services/api'
import type { CursoComArvore, QuizCompleto } from '../../types'
import QuizForm from './QuizForm'

vi.mock('../../services/api', () => ({
  cursosApi: {
    getCompleto: vi.fn(),
    getQuizById: vi.fn(),
    criarQuiz: vi.fn(),
    atualizarQuiz: vi.fn(),
  },
}))

const curso: CursoComArvore = {
  id: 'curso-1',
  slug: 'projeto-digital',
  titulo: 'Projeto Digital',
  descricao: 'Curso',
  publicado: true,
  created_at: '2026-09-20T00:00:00.000Z',
  updated_at: '2026-09-20T00:00:00.000Z',
  total_aulas: 2,
  duracao_seg: 600,
  modulos: [
    {
      id: 'modulo-1',
      curso_id: 'curso-1',
      ordem: 0,
      titulo: 'Transistores',
      aulas: [
        {
          publicado: true,
          id: 'aula-1',
          slug: 'simulando',
          titulo: 'Simulando uma célula padrão',
          duracao_seg: 300,
          tem_video: false,
          opcional: false,
        },
        {
          publicado: true,
          id: 'aula-2',
          slug: 'mosfet',
          titulo: 'Desenhando um MOSFET',
          duracao_seg: 300,
          tem_video: false,
          opcional: false,
        },
      ],
      quizzes: [],
    },
  ],
}

const quiz: QuizCompleto = {
  id: 'quiz-1',
  curso_id: 'curso-1',
  modulo_id: 'modulo-1',
  aula_id: 'aula-1',
  ordem: 0,
  slug: 'quiz-celulas',
  titulo: 'Quiz: células padrão',
  nota_minima: 70,
  publicado: false,
  created_at: '2026-09-20T00:00:00.000Z',
  updated_at: '2026-09-20T00:00:00.000Z',
  questoes: [
    {
      id: 'questao-1',
      ordem: 0,
      enunciado: 'Primeiro enunciado',
      explicacao: 'Primeira explicação',
      alternativas: ['A', 'B', 'C', 'D'].map((texto, indice) => ({
        id: `q1-${indice}`,
        ordem: indice,
        texto,
        correta: indice === 0,
      })),
    },
    {
      id: 'questao-2',
      ordem: 1,
      enunciado: 'Segundo enunciado',
      explicacao: 'Segunda explicação',
      alternativas: ['E', 'F', 'G', 'H'].map((texto, indice) => ({
        id: `q2-${indice}`,
        ordem: indice,
        texto,
        correta: indice === 1,
      })),
    },
  ],
}

function renderizar(rota = '/admin/cursos/projeto-digital/quizzes/quiz-1') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/admin/cursos/:cursoSlug/quizzes/:quizId" element={<QuizForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('QuizForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cursosApi.getCompleto).mockResolvedValue(curso)
    vi.mocked(cursosApi.getQuizById).mockResolvedValue(quiz)
    vi.mocked(cursosApi.atualizarQuiz).mockResolvedValue(quiz)
    vi.mocked(cursosApi.criarQuiz).mockResolvedValue(quiz)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('adiciona e seleciona uma questão sem perder o texto das anteriores', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findByDisplayValue('Primeiro enunciado')

    await usuario.click(screen.getByRole('button', { name: 'Adicionar questão' }))
    const enunciado = screen.getByRole('textbox', { name: 'Enunciado' })
    await usuario.type(enunciado, 'Terceiro enunciado')
    await usuario.click(screen.getByRole('button', { name: 'Editar questão 1' }))

    expect(screen.getByRole('textbox', { name: 'Enunciado' })).toHaveValue('Primeiro enunciado')
    await usuario.click(screen.getByRole('button', { name: 'Editar questão 3' }))
    expect(screen.getByRole('textbox', { name: 'Enunciado' })).toHaveValue('Terceiro enunciado')
  })

  it('reordena as questões e envia o payload na nova ordem', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findByDisplayValue('Primeiro enunciado')

    await usuario.click(screen.getByRole('button', { name: 'Mover questão 2 para cima' }))
    await usuario.click(screen.getByRole('button', { name: 'Salvar rascunho' }))

    await waitFor(() => expect(cursosApi.atualizarQuiz).toHaveBeenCalledOnce())
    const payload = vi.mocked(cursosApi.atualizarQuiz).mock.calls[0]![1]
    expect(payload.questoes?.map((questao) => questao.enunciado)).toEqual([
      'Segundo enunciado',
      'Primeiro enunciado',
    ])
  })

  it('pede confirmação antes de excluir uma questão com conteúdo', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findByDisplayValue('Primeiro enunciado')

    await usuario.click(screen.getByRole('button', { name: 'Excluir questão 1' }))

    expect(window.confirm).toHaveBeenCalledWith(
      'Excluir esta questão e todas as alternativas dela?',
    )
    expect(screen.queryByText('Primeiro enunciado')).not.toBeInTheDocument()
  })

  it('salva um quiz completo como rascunho e bloqueia publicação quando há erros', async () => {
    const usuario = userEvent.setup()
    renderizar()
    const enunciado = await screen.findByDisplayValue('Primeiro enunciado')
    const publicar = screen.getByRole('switch', { name: 'Publicada' })
    expect(publicar).toBeEnabled()

    await usuario.clear(enunciado)
    expect(publicar).toBeDisabled()
    await usuario.type(enunciado, 'Primeiro enunciado revisado')
    await usuario.click(screen.getByRole('button', { name: 'Salvar rascunho' }))

    await waitFor(() => expect(cursosApi.atualizarQuiz).toHaveBeenCalledOnce())
    expect(vi.mocked(cursosApi.atualizarQuiz).mock.calls[0]![1].publicado).toBe(false)
  })

  it('mostra a mensagem da API quando o slug já existe', async () => {
    const usuario = userEvent.setup()
    vi.mocked(cursosApi.atualizarQuiz).mockRejectedValue({
      response: { data: { error: 'Já existe um quiz com este slug no curso' } },
    })
    renderizar()
    await screen.findByDisplayValue('Primeiro enunciado')

    await usuario.click(screen.getByRole('button', { name: 'Salvar rascunho' }))

    expect(await screen.findByText('Já existe um quiz com este slug no curso')).toBeInTheDocument()
  })
})
