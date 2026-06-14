import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { uploadApi } from '../../../services/api';
import { $createImageNode } from '../nodes/ImageNode';
import { $createImageGalleryNode, GalleryLayout } from '../nodes/ImageGalleryNode';

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

export async function uploadImageFiles(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    if (file.size > MAX_IMAGE_SIZE) {
      console.warn(`Imagem ${file.name} excede 50MB e foi ignorada.`);
      continue;
    }

    try {
      const response = await uploadApi.uploadFile(file);
      if (response?.url) {
        uploadedUrls.push(response.url);
      }
    } catch (error) {
      console.error(`Erro ao enviar ${file.name}:`, error);
    }
  }

  return uploadedUrls;
}

export function insertUploadedImages(
  editor: LexicalEditor,
  urls: string[],
  layout: GalleryLayout = 'grid',
): void {
  if (urls.length === 0) return;

  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    if (urls.length === 1) {
      selection.insertNodes([
        $createImageNode({
          altText: 'Imagem',
          src: urls[0],
          width: '100%',
          height: 'auto',
        }),
      ]);
      return;
    }

    selection.insertNodes([
      $createImageGalleryNode({
        images: urls,
        layout,
      }),
    ]);
  });
}

export function pickImageFiles(multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';

    input.onchange = () => {
      resolve(input.files ? Array.from(input.files) : []);
    };

    input.click();
  });
}
