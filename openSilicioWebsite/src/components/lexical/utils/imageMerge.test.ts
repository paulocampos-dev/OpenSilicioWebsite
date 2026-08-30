import { describe, it, expect } from 'vitest'
import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot } from 'lexical'
import { $mergeImageIntoTarget } from './imageMerge'
import { $createImageNode, ImageNode } from '../nodes/ImageNode'
import { $createImageGalleryNode, ImageGalleryNode } from '../nodes/ImageGalleryNode'

function makeEditor() {
  return createHeadlessEditor({ nodes: [ImageNode, ImageGalleryNode] })
}

describe('$mergeImageIntoTarget', () => {
  it('combines two images into a new gallery, removing the source node', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        const existing = $createImageNode({ altText: 'a', src: 'a.png' })
        const source = $createImageNode({ altText: 'b', src: 'b.png' })
        $getRoot().append(existing, source)

        const merged = $mergeImageIntoTarget(existing, source, 'b.png')

        expect(merged).toBe(true)
        const children = $getRoot().getChildren()
        expect(children).toHaveLength(1)
        const [gallery] = children
        expect(gallery instanceof ImageGalleryNode).toBe(true)
        expect((gallery as ImageGalleryNode).getImages()).toEqual(['a.png', 'b.png'])
      },
      { discrete: true }
    )
  })

  it('appends to an existing gallery, removing the source node', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        const gallery = $createImageGalleryNode({ images: ['a.png', 'b.png'], layout: 'grid' })
        const source = $createImageNode({ altText: 'c', src: 'c.png' })
        $getRoot().append(gallery, source)

        const merged = $mergeImageIntoTarget(gallery, source, 'c.png')

        expect(merged).toBe(true)
        expect(gallery.getImages()).toEqual(['a.png', 'b.png', 'c.png'])
        expect($getRoot().getChildren()).toHaveLength(1)
      },
      { discrete: true }
    )
  })

  it('does not merge into a still-loading image', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        const existing = $createImageNode({ altText: 'a', src: 'a.png', loading: true })
        const source = $createImageNode({ altText: 'b', src: 'b.png' })
        $getRoot().append(existing, source)

        const merged = $mergeImageIntoTarget(existing, source, 'b.png')

        expect(merged).toBe(false)
        expect($getRoot().getChildren()).toHaveLength(2)
      },
      { discrete: true }
    )
  })

  it('does not merge a node into itself', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        const source = $createImageNode({ altText: 'a', src: 'a.png' })
        $getRoot().append(source)

        const merged = $mergeImageIntoTarget(source, source, 'a.png')

        expect(merged).toBe(false)
      },
      { discrete: true }
    )
  })

  it('returns false for a non-mergeable target (e.g. null), leaving the source untouched', () => {
    const editor = makeEditor()
    editor.update(
      () => {
        const source = $createImageNode({ altText: 'a', src: 'a.png' })
        $getRoot().append(source)

        const merged = $mergeImageIntoTarget(null, source, 'a.png')

        expect(merged).toBe(false)
        expect($getRoot().getChildren()).toHaveLength(1)
      },
      { discrete: true }
    )
  })
})
