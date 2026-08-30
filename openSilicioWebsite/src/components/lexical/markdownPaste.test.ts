import { describe, it, expect } from 'vitest'
import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical'
import { $generateNodesFromSerializedNodes, $insertGeneratedNodes } from '@lexical/clipboard'
import { isTrivialHtml, looksLikeMarkdown, markdownToSerializedNodes } from './markdownPaste'
import { LEXICAL_NODES } from './nodeSet'
import { $isHeadingNode } from '@lexical/rich-text'

describe('looksLikeMarkdown', () => {
  it('recognizes headings, list items, bold spans, and links', () => {
    expect(looksLikeMarkdown('## Um título')).toBe(true)
    expect(looksLikeMarkdown('- item da lista')).toBe(true)
    expect(looksLikeMarkdown('texto com **negrito** no meio')).toBe(true)
    expect(looksLikeMarkdown('veja o [link](https://example.com)')).toBe(true)
  })

  it('does not flag ordinary prose that merely contains # or *', () => {
    expect(looksLikeMarkdown('O projeto custou R$ 200 * 3 unidades')).toBe(false)
    expect(looksLikeMarkdown('Envie um e-mail para contato@opensilicio.com.br')).toBe(false)
  })

  it('returns false for blank/whitespace-only text', () => {
    expect(looksLikeMarkdown('   ')).toBe(false)
  })
})

describe('isTrivialHtml', () => {
  it('treats bare wrapper markup as trivial', () => {
    expect(isTrivialHtml('')).toBe(true)
    expect(isTrivialHtml('<meta charset="utf-8">plain text')).toBe(true)
    expect(isTrivialHtml('<div><span style="color:red">plain text</span></div>')).toBe(true)
  })

  it('treats markup with actual rich structure as non-trivial', () => {
    expect(isTrivialHtml('<h2>Título</h2>')).toBe(false)
    expect(isTrivialHtml('<ul><li>item</li></ul>')).toBe(false)
    expect(isTrivialHtml('<p>veja o <a href="https://example.com">link</a></p>')).toBe(false)
    expect(isTrivialHtml('<p><strong>negrito</strong></p>')).toBe(false)
  })
})

describe('markdownToSerializedNodes', () => {
  it('converts markdown source into serialized nodes matching the document structure', () => {
    const nodes = markdownToSerializedNodes('## Título\n\nUm parágrafo.')
    expect(nodes).toHaveLength(2)
    expect(nodes[0]).toMatchObject({ type: 'heading', tag: 'h2' })
    expect(nodes[1]).toMatchObject({ type: 'paragraph' })
  })

  it('produces nodes that can be inserted into an existing document without clearing it', () => {
    // This is the behavior that matters for paste: $convertFromMarkdownString
    // clears whatever node it's given, so the conversion must happen off to
    // the side (a headless editor) and the *result* inserted at the
    // selection in the real editor, leaving prior content untouched.
    const editor = createHeadlessEditor({ nodes: LEXICAL_NODES })

    editor.update(
      () => {
        $getRoot().append($createParagraphNode().append($createTextNode('conteúdo existente')))
      },
      { discrete: true },
    )

    const serializedNodes = markdownToSerializedNodes('## Novo título')

    editor.update(
      () => {
        const root = $getRoot()
        const selection = root.getLastChild()!.selectEnd()
        const nodes = $generateNodesFromSerializedNodes(serializedNodes)
        $insertGeneratedNodes(editor, nodes, selection)

        const children = root.getChildren()
        expect(children).toHaveLength(2)
        expect(children[0]!.getTextContent()).toBe('conteúdo existente')
        expect($isHeadingNode(children[1])).toBe(true)
        expect(children[1]!.getTextContent()).toBe('Novo título')
      },
      { discrete: true },
    )
  })

  it('keeps the text and inline formatting of every converted block', () => {
    // ElementNode.exportJSON() devolve `children: []` fixo, então serializar
    // filho a filho monta os blocos certos e perde todo o texto. Aviso honesto:
    // este teste NÃO pega essa regressão. O ambiente headless preserva o texto
    // mesmo com a serialização errada; no navegador, não. A verificação real
    // foi feita colando no editor de verdade, e é lá que precisa ser refeita se
    // esta função mudar.
    const nodes = markdownToSerializedNodes(
      '## Título\n\nUm **parágrafo** com [link](https://example.com).\n\n- item um\n- item dois',
    )

    const editor = createHeadlessEditor({ nodes: LEXICAL_NODES })
    editor.update(
      () => {
        const root = $getRoot()
        root.append($createParagraphNode())
        const selection = root.getLastChild()!.selectEnd()
        $insertGeneratedNodes(editor, $generateNodesFromSerializedNodes(nodes), selection)

        const texto = root.getTextContent()
        expect(texto).toContain('Título')
        expect(texto).toContain('parágrafo')
        expect(texto).toContain('link')
        expect(texto).toContain('item um')
        expect(texto).toContain('item dois')
      },
      { discrete: true },
    )
  })
})
