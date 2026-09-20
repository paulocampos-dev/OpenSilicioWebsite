import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { ModuloNaArvore } from '../../types'
import ListaDeAtividades from './ListaDeAtividades'

const modulo: ModuloNaArvore = {
  id: 'modulo',
  curso_id: 'curso',
  ordem: 0,
  titulo: 'Células',
  aulas: [
    {
      publicado: true,
      id: 'aula-1',
      slug: 'aula-1',
      titulo: 'Primeira aula',
      duracao_seg: 120,
      tem_video: false,
      opcional: false,
    },
  ],
  quizzes: [
    {
      publicado: true,
      id: 'quiz-aula',
      aula_id: 'aula-1',
      slug: 'quiz-aula',
      titulo: 'Quiz da aula',
      nota_minima: 70,
      total_questoes: 4,
    },
    { publicado: false, id: 'quiz-rascunho', titulo: 'Quiz em preparação' },
    {
      publicado: true,
      id: 'quiz-final',
      aula_id: null,
      slug: 'quiz-final',
      titulo: 'Revisão do módulo',
      nota_minima: 70,
      total_questoes: 5,
    },
  ],
}

function renderizar(notas: Record<string, number | null> = {}) {
  return render(
    <MemoryRouter>
      <ListaDeAtividades
        modulo={modulo}
        cursoSlug="projeto-digital"
        numeroInicial={1}
        aulaConcluida={() => false}
        notaDoQuiz={(slug) => notas[slug] ?? null}
        quizConcluido={(slug) => (notas[slug] ?? 0) >= 70}
      />
    </MemoryRouter>,
  )
}

describe('ListaDeAtividades', () => {
  it('intercala quizzes, deixa rascunho sem link e não numera quizzes', () => {
    renderizar()

    const linhas = screen.getAllByTestId('atividade').map((linha) => linha.textContent)
    expect(linhas).toEqual([
      expect.stringContaining('01Primeira aula'),
      expect.stringContaining('Quiz da aula'),
      expect.stringContaining('Quiz em preparação'),
      expect.stringContaining('Revisão do módulo'),
    ])
    expect(screen.getByRole('link', { name: /Quiz da aula/ })).toHaveAttribute(
      'href',
      '/cursos/projeto-digital/quizzes/quiz-aula',
    )
    expect(screen.queryByRole('link', { name: /Quiz em preparação/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Quiz da aula/ })).not.toHaveTextContent('02')
  })

  it('descreve quiz pendente, tentado e concluído', () => {
    const { rerender } = renderizar()
    expect(screen.getByRole('link', { name: /Quiz da aula/ })).toHaveTextContent('Pendente')

    rerender(
      <MemoryRouter>
        <ListaDeAtividades
          modulo={modulo}
          cursoSlug="projeto-digital"
          numeroInicial={1}
          aulaConcluida={() => false}
          notaDoQuiz={(slug) => (slug === 'quiz-aula' ? 50 : 75)}
          quizConcluido={(slug) => slug === 'quiz-final'}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /Quiz da aula/ })).toHaveTextContent('Melhor nota: 50%')
    expect(screen.getByRole('link', { name: /Revisão do módulo/ })).toHaveTextContent('Concluído: 75%')
  })
})
