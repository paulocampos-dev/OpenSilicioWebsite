import { describe, it, expect } from 'vitest'
import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot, $isElementNode } from 'lexical'
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown'
import { EDITOR_TRANSFORMERS } from './transformers'
import { LEXICAL_NODES } from './nodeSet'
import { $isImageNode } from './nodes/ImageNode'

function makeEditor() {
  return createHeadlessEditor({ nodes: LEXICAL_NODES })
}

describe('EDITOR_TRANSFORMERS', () => {
  it('imports standard markdown constructs already used by conteudo/ (heading, bold, list, link)', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        $convertFromMarkdownString(
          '## Título\n\n**negrito** e um [link](https://example.com)\n\n- item um\n- item dois',
          EDITOR_TRANSFORMERS,
        )
        const markdown = $convertToMarkdownString(EDITOR_TRANSFORMERS)
        expect(markdown).toContain('## Título')
        expect(markdown).toContain('**negrito**')
        expect(markdown).toContain('[link](https://example.com)')
        expect(markdown).toContain('- item um')
      },
      { discrete: true },
    )
  })

  it('round-trips image markdown into an ImageNode via the custom IMAGE_TRANSFORMER', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        $convertFromMarkdownString('![a diagram](https://example.com/diagram.png)', EDITOR_TRANSFORMERS)

        const paragraph = $getRoot().getFirstChild()
        if (!$isElementNode(paragraph)) throw new Error('expected a paragraph')
        const [imageNode] = paragraph.getChildren()
        expect($isImageNode(imageNode)).toBe(true)
        if ($isImageNode(imageNode)) {
          expect(imageNode.getSrc()).toBe('https://example.com/diagram.png')
          expect(imageNode.getAltText()).toBe('a diagram')
        }

        const markdown = $convertToMarkdownString(EDITOR_TRANSFORMERS)
        expect(markdown).toBe('![a diagram](https://example.com/diagram.png)')
      },
      { discrete: true },
    )
  })
})
