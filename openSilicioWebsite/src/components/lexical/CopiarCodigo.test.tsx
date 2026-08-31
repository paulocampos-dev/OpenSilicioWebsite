import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import LexicalContent from '../LexicalContent'

/* O teste que faltava da primeira vez.

   A primeira versão do botão de copiar inseria o nó dentro do <code>, e o
   Lexical o removia numa reconciliação, o que fazia o observador reinserir sem
   parar. A aba travava. Um teste que não montasse o LexicalContent de verdade
   nunca veria isso: o laço só existe quando o Lexical está no meio.

   Por isso este arquivo monta o leitor completo. Se o laço voltar, estes testes
   não falham por asserção, eles estouram o tempo, que é exatamente o sintoma
   que o leitor sentiria. */

beforeEach(() => {
  // jsdom não traz ResizeObserver, e o componente depende dele.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  // O jsdom não se declara contexto seguro, e sem isso o componente pula a API
  // moderna e vai direto para o plano B, que o jsdom também não implementa.
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
})

afterEach(cleanup)

const texto = (t: string) => ({
  detail: 0, format: 0, mode: 'normal', style: '', text: t, type: 'text', version: 1,
})

function conteudo(blocos: Array<{ lang: string; linhas: string[] }>) {
  return JSON.stringify({
    root: {
      children: [
        { children: [texto('Antes dos blocos.')], direction: null, format: '', indent: 0, type: 'paragraph', version: 1 },
        ...blocos.map((b) => ({
          children: b.linhas.flatMap((l, i) => (i ? [{ type: 'linebreak', version: 1 }, texto(l)] : [texto(l)])),
          direction: null, format: '', indent: 0, type: 'code', version: 1, language: b.lang,
        })),
      ],
      direction: null, format: '', indent: 0, type: 'root', version: 1,
    },
  })
}

describe('botões de copiar sobre os blocos de código', () => {
  it('renderiza o conteúdo e os botões sem entrar em laço', async () => {
    render(<LexicalContent content={conteudo([
      { lang: 'bash', linhas: ['sudo apt update', 'sudo apt install docker.io'] },
      { lang: 'powershell', linhas: ['irm https://osic.tools/install.ps1 | iex'] },
    ])} />)

    await waitFor(() => {
      expect(document.querySelectorAll('code[data-language]')).toHaveLength(2)
    }, { timeout: 4000 })

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /copiar o código do bloco/i })).toHaveLength(2)
    }, { timeout: 4000 })
  })

  it('não insere nada dentro do contenteditable do Lexical', async () => {
    render(<LexicalContent content={conteudo([{ lang: 'bash', linhas: ['echo oi'] }])} />)
    await waitFor(() => expect(document.querySelector('code[data-language]')).toBeTruthy(), { timeout: 4000 })
    await waitFor(() => expect(document.querySelector('.os-copiar-codigo')).toBeTruthy(), { timeout: 4000 })

    // A regra que o incidente ensinou: o botão vive fora do editor.
    const editavel = document.querySelector('[contenteditable]')
    expect(editavel).toBeTruthy()
    expect(editavel!.querySelector('.os-copiar-codigo')).toBeNull()
    expect(document.querySelector('code[data-language]')!.querySelector('.os-copiar-codigo')).toBeNull()
  })

  it('copia o texto do bloco correspondente', async () => {
    render(<LexicalContent content={conteudo([
      { lang: 'bash', linhas: ['primeiro comando'] },
      { lang: 'bash', linhas: ['segundo comando'] },
    ])} />)
    const botoes = await waitFor(
      () => screen.getAllByRole('button', { name: /copiar o código do bloco/i }),
      { timeout: 4000 },
    )
    expect(botoes).toHaveLength(2)

    botoes[1]!.click()
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())
    expect(vi.mocked(navigator.clipboard.writeText).mock.calls[0]![0]).toContain('segundo comando')
  })

  it('não rende botão quando o post não tem bloco de código', async () => {
    render(<LexicalContent content={conteudo([])} />)
    await waitFor(() => expect(document.body.textContent).toContain('Antes dos blocos'), { timeout: 4000 })
    expect(document.querySelectorAll('.os-copiar-codigo')).toHaveLength(0)
  })
})
