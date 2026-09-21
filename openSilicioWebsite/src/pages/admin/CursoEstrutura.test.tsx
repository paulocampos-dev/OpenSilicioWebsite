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

    expect((await screen.findAllByText('Quiz: células padrão')).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/4 questões · mínimo 70% · depois de Simulando uma célula padrão/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Rascunho').length).toBeGreaterThan(0)
    expect(
      screen
        .getAllByRole('link', { name: 'Novo quiz' })
        .every((link) => link.getAttribute('href') === '/admin/cursos/projeto-digital/quizzes/novo?modulo=modulo-1'),
    ).toBe(true)
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

  it('reúne ações de módulo e aula em menus e mantém a criação acessível', async () => {
    const usuario = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/admin/cursos/projeto-digital/estrutura']}>
        <Routes>
          <Route path="/admin/cursos/:cursoSlug/estrutura" element={<CursoEstrutura />} />
        </Routes>
      </MemoryRouter>,
    )

    await usuario.click(await screen.findByRole('button', { name: 'Ações do módulo Transistores' }))
    expect(screen.getByRole('menuitem', { name: 'Mover módulo para baixo' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('menuitem', { name: 'Renomear módulo' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Deletar módulo' })).toBeVisible()
    await usuario.keyboard('{Escape}')

    await usuario.click(screen.getByRole('button', { name: 'Ações de Simulando uma célula padrão' }))
    expect(screen.getByRole('menuitem', { name: 'Editar aula' })).toHaveAttribute(
      'href',
      '/admin/cursos/projeto-digital/aulas/aula-1',
    )

    expect(screen.getByTestId('mobile-create-actions')).toHaveStyle({ position: 'sticky' })
    expect(screen.getByTestId('mobile-create-actions')).toHaveTextContent('Nova aula')
    expect(screen.getByTestId('mobile-create-actions')).toHaveTextContent('Novo quiz')
  })
})
