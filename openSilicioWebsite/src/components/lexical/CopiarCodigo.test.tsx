import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aplicarBotoesDeCopiar } from './CopiarCodigo'

/* Monta a mesma forma de DOM que o Lexical produz para um bloco de código:
   um <code> com data-language, linhas separadas por <br>, e código inline em
   <code> sem data-language, que não deve ganhar botão. */
function montarConteudo() {
  document.body.innerHTML = `
    <div id="raiz">
      <p>Rode isto, e note o <code>sudo</code> inline.</p>
      <code data-language="bash" class="os-code">sudo apt update<br>sudo apt install docker.io</code>
      <code data-language="powershell" class="os-code">irm https://osic.tools/install.ps1 | iex</code>
    </div>`
  return document.getElementById('raiz')!
}

describe('aplicarBotoesDeCopiar', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('coloca um botão por bloco de código e ignora o código inline', () => {
    const raiz = montarConteudo()
    aplicarBotoesDeCopiar(raiz)
    expect(raiz.querySelectorAll('.os-copiar-codigo')).toHaveLength(2)
    expect(raiz.querySelector('p code')!.querySelector('.os-copiar-codigo')).toBeNull()
  })

  it('não duplica o botão quando roda de novo', () => {
    const raiz = montarConteudo()
    aplicarBotoesDeCopiar(raiz)
    aplicarBotoesDeCopiar(raiz)
    aplicarBotoesDeCopiar(raiz)
    expect(raiz.querySelectorAll('.os-copiar-codigo')).toHaveLength(2)
  })

  it('copia o texto do bloco sem o rótulo do próprio botão', async () => {
    const raiz = montarConteudo()
    aplicarBotoesDeCopiar(raiz)
    const botao = raiz.querySelector<HTMLButtonElement>('.os-copiar-codigo')!

    botao.click()
    await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())

    const copiado = vi.mocked(navigator.clipboard.writeText).mock.calls[0]![0]
    expect(copiado).toContain('sudo apt update')
    expect(copiado).toContain('sudo apt install docker.io')
    expect(copiado).not.toContain('copiar')
  })

  it('dá retorno visual e volta ao normal depois', async () => {
    vi.useFakeTimers()
    const raiz = montarConteudo()
    aplicarBotoesDeCopiar(raiz)
    const botao = raiz.querySelector<HTMLButtonElement>('.os-copiar-codigo')!

    botao.click()
    await vi.advanceTimersByTimeAsync(10)
    expect(botao.textContent).toBe('copiado')

    await vi.advanceTimersByTimeAsync(2000)
    expect(botao.textContent).toBe('copiar')
    vi.useRealTimers()
  })
})
