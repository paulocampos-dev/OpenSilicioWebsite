import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cursosApi } from '../../services/api'
import type { CursoComArvore } from '../../types'
import CursoEstrutura from './CursoEstrutura'

vi.mock('../../services/api', () => ({
  cursosApi: {
    getCompleto: vi.fn(),
    update: vi.fn(),
    criarModulo: vi.fn(),
    atualizarModulo: vi.fn(),
    publicarModulo: vi.fn(),
    deletarModulo: vi.fn(),
    reordenarModulos: vi.fn(),
    reordenarAulas: vi.fn(),
    deletarAula: vi.fn(),
    deletarQuiz: vi.fn(),
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
  total_aulas: 1,
  duracao_seg: 300,
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
      ],
      quizzes: [
        {
          publicado: false,
          id: 'quiz-1',
          aula_id: 'aula-1',
          slug: 'quiz-celulas',
          titulo: 'Quiz: células padrão',
          nota_minima: 70,
          total_questoes: 4,
        },
      ],
    },
  ],
}

describe('CursoEstrutura com quizzes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cursosApi.getCompleto).mockResolvedValue(curso)
    vi.mocked(cursosApi.deletarQuiz).mockResolvedValue(undefined)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('mostra quiz, posição, estado e ações próprias sem incluí-lo em publicar módulo', async () => {
    const usuario = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin/cursos/projeto-digital/estrutura']}>
        <Routes>
          <Route path="/admin/cursos/:cursoSlug/estrutura" element={<CursoEstrutura />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Quiz: células padrão')).toBeInTheDocument()
    expect(screen.getByText(/4 questões · mínimo 70% · depois de Simulando uma célula padrão/i)).toBeInTheDocument()
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Novo quiz' })).toHaveAttribute(
      'href',
      '/admin/cursos/projeto-digital/quizzes/novo?modulo=modulo-1',
    )
    expect(screen.getByRole('link', { name: 'Editar quiz Quiz: células padrão' })).toHaveAttribute(
      'href',
      '/admin/cursos/projeto-digital/quizzes/quiz-1',
    )

    await usuario.click(screen.getByRole('button', { name: 'Deletar quiz Quiz: células padrão' }))
    expect(window.confirm).toHaveBeenCalledWith(
      'Apagar o quiz "Quiz: células padrão" e todas as questões dele?',
    )
    await waitFor(() => expect(cursosApi.deletarQuiz).toHaveBeenCalledWith('quiz-1'))
  })
})
