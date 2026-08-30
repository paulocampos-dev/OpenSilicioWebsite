import { LexicalNode } from 'lexical'
import { $isImageNode, ImageNode } from '../nodes/ImageNode'
import { $createImageGalleryNode, $isImageGalleryNode } from '../nodes/ImageGalleryNode'

/**
 * Combine `existing` with a newly-available image src into a gallery, removing `sourceNode`
 * (the node that owned that src) once its src lives in the gallery instead.
 * Returns false when `existing` isn't a mergeable image/gallery, leaving both nodes untouched
 * so the caller can apply its own fallback.
 */
export function $mergeImageIntoTarget(existing: LexicalNode | null, sourceNode: ImageNode, newSrc: string): boolean {
  if (existing && existing.getKey() === sourceNode.getKey()) return false

  if ($isImageNode(existing) && !existing.isLoading()) {
    const galleryNode = $createImageGalleryNode({ images: [existing.getSrc(), newSrc], layout: 'grid' })
    existing.replace(galleryNode)
    sourceNode.remove()
    return true
  }

  if ($isImageGalleryNode(existing)) {
    existing.setImages([...existing.getImages(), newSrc])
    sourceNode.remove()
    return true
  }

  return false
}
