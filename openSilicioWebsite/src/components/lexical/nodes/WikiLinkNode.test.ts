import { describe, it, expect } from 'vitest'
import { createHeadlessEditor } from '@lexical/headless'
// Vem pinado pelo @lexical/clipboard, que é dependência direta. É a função que
// o Lexical usa de verdade ao colar HTML, então é nela que o teste tem de bater.
import { $generateNodesFromDOM } from '@lexical/html'
import { LEXICAL_NODES } from '../nodeSet'
import { WikiLinkNode } from './WikiLinkNode'

/* O importDOM do WikiLinkNode reivindicava qualquer <a>. Como o LinkNode
   registra <a> na mesma prioridade e o Lexical desempata pelo último importer
   registrado (e o WikiLinkNode vem depois na lista de nodes), todo link colado
   virava verbete: um link externo saía com a classe .wiki-link, com cara de
   termo interno da wiki. Aconteceu com o link do GitHub no post 04. */

function importar(html: string) {
  const editor = createHeadlessEditor({
    nodes: LEXICAL_NODES,
    onError: (erro) => {
      throw erro
    },
  })

  let tipos: string[] = []
  let nos: ReturnType<typeof $generateNodesFromDOM> = []
  editor.update(
    () => {
      const dom = new DOMParser().parseFromString(html, 'text/html')
      nos = $generateNodesFromDOM(editor, dom)
      tipos = nos.map((no) => no.getType())
    },
    { discrete: true },
  )
  return { tipos, nos }
}

describe('WikiLinkNode.importDOM', () => {
  it('deixa link externo virar link normal', () => {
    const { tipos } = importar(
      '<a href="https://github.com/google/skywater-pdk-libs-sky130_fd_sc_hd">o PDK</a>',
    )
    expect(tipos).toEqual(['link'])
  })

  it('reconhece o verbete pela classe que o editor grava', () => {
    const { tipos } = importar('<a href="/wiki/celula-padrao" class="wiki-link">célula padrão</a>')
    expect(tipos).toEqual(['wikilink'])
  })

  it('reconhece o verbete pela URL, mesmo sem a classe', () => {
    const { tipos } = importar('<a href="/wiki/pdk">PDK</a>')
    expect(tipos).toEqual(['wikilink'])
  })

  it('preserva o estado pendente do verbete', () => {
    const { nos } = importar(
      '<a href="/wiki/pending-abc" class="wiki-link wiki-link-pending">termo novo</a>',
    )
    const no = nos[0]
    expect(no).toBeInstanceOf(WikiLinkNode)
    expect((no as WikiLinkNode).getIsPending()).toBe(true)
  })

  it('não reivindica âncora sem href', () => {
    expect(WikiLinkNode.importDOM()!.a!(document.createElement('a'))).toBeNull()
  })
})
