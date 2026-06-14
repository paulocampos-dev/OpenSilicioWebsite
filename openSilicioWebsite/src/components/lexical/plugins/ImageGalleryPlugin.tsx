import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $createImageGalleryNode, GalleryLayout } from '../nodes/ImageGalleryNode';
import { insertUploadedImages, pickImageFiles, uploadImageFiles } from '../utils/imageUploadUtils';

export type InsertImageGalleryPayload = {
  layout?: GalleryLayout;
};

export const INSERT_IMAGE_GALLERY_COMMAND: LexicalCommand<InsertImageGalleryPayload | void> =
  createCommand('INSERT_IMAGE_GALLERY_COMMAND');

export default function ImageGalleryPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_GALLERY_COMMAND,
      (payload) => {
        const layout = payload?.layout ?? 'grid';

        void (async () => {
          const files = await pickImageFiles(true);
          if (files.length === 0) return;

          const uploadedUrls = await uploadImageFiles(files);
          if (uploadedUrls.length === 0) {
            alert('Nenhuma imagem conseguiu ser carregada.');
            return;
          }

          insertUploadedImages(editor, uploadedUrls, layout);
        })();

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
