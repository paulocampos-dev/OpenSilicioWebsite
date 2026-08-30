import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
  PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { $createImageNode, $isImageNode } from '../nodes/ImageNode';
import { insertUploadedImages, pickImageFiles, uploadImageFiles, MAX_IMAGE_SIZE } from '../utils/imageUploadUtils';
import { $mergeImageIntoTarget } from '../utils/imageMerge';

const MAX_IMAGE_SIZE_MB = MAX_IMAGE_SIZE / (1024 * 1024);

export const INSERT_IMAGE_COMMAND: LexicalCommand<void> = createCommand('INSERT_IMAGE_COMMAND');

async function uploadImage(file: File): Promise<string | null> {
  const urls = await uploadImageFiles([file]);
  return urls[0] ?? null;
}

function insertImageWithUpload(editor: LexicalEditor, file: File) {
  if (file.size > MAX_IMAGE_SIZE) {
    alert(`A imagem ${file.name} excede o limite de tamanho (${MAX_IMAGE_SIZE_MB}MB)`);
    return;
  }

  const temporaryUrl = URL.createObjectURL(file);

  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const imageNode = $createImageNode({
      altText: file.name,
      src: temporaryUrl,
      loading: true,
      width: '100%',
      height: 'auto',
    });
    selection.insertNodes([imageNode]);

    void uploadImage(file).then((url) => {
      if (url) {
        editor.update(() => {
          const node = $getNodeByKey(imageNode.getKey());
          if (!node || !$isImageNode(node)) return;

          const merged = $mergeImageIntoTarget(node.getPreviousSibling(), node, url);
          if (!merged) node.setSrc(url);
        });
      } else {
        editor.update(() => {
          const node = $getNodeByKey(imageNode.getKey());
          if (node && $isImageNode(node)) {
            node.remove();
            alert(`Falha ao fazer upload da imagem ${file.name}`);
          }
        });
      }

      setTimeout(() => URL.revokeObjectURL(temporaryUrl), 1000);
    });
  });
}

function handleImageFiles(editor: LexicalEditor, files: File[], layout: 'grid' | 'carousel' = 'grid') {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  if (imageFiles.length === 0) return false;

  if (imageFiles.length > 1) {
    void (async () => {
      const uploadedUrls = await uploadImageFiles(imageFiles);
      if (uploadedUrls.length === 0) {
        alert('Falha ao colar imagens para a galeria.');
        return;
      }
      insertUploadedImages(editor, uploadedUrls, layout);
    })();
    return true;
  }

  insertImageWithUpload(editor, imageFiles[0]);
  return true;
}

export default function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeImagePluginCommands(editor);
  }, [editor]);

  return null;
}

function mergeImagePluginCommands(editor: LexicalEditor) {
  const unregisterInsert = editor.registerCommand(
    INSERT_IMAGE_COMMAND,
    () => {
      void (async () => {
        const files = await pickImageFiles(false);
        if (files.length === 0) return;
        insertImageWithUpload(editor, files[0]);
      })();
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );

  const unregisterPaste = editor.registerCommand(
    PASTE_COMMAND,
    (event: ClipboardEvent | InputEvent | KeyboardEvent) => {
      if (!(event instanceof ClipboardEvent)) return false;
      const { clipboardData } = event;
      if (!clipboardData) return false;

      const files = Array.from(clipboardData.files);
      if (files.length === 0) return false;

      event.preventDefault();
      return handleImageFiles(editor, files);
    },
    COMMAND_PRIORITY_HIGH,
  );

  const unregisterDrop = editor.registerCommand(
    DROP_COMMAND,
    (event: DragEvent) => {
      const dataTransfer = event.dataTransfer;
      if (!dataTransfer) return false;

      const droppedFiles = Array.from(dataTransfer.files).filter((file) => file.type.startsWith('image/'));
      if (droppedFiles.length > 0) {
        event.preventDefault();
        return handleImageFiles(editor, droppedFiles);
      }

      const lexicalDragData = dataTransfer.getData('application/x-lexical-drag');
      if (!lexicalDragData) return false;

      try {
        const parsedData = JSON.parse(lexicalDragData);
        if (parsedData.type !== 'image') return false;

        event.preventDefault();

        editor.update(() => {
          const targetDOMNode = document.elementFromPoint(event.clientX, event.clientY);
          if (!targetDOMNode) return;

          const targetLexicalNode = $getNearestNodeFromDOMNode(targetDOMNode);
          if (!targetLexicalNode) return;

          const draggedKey = parsedData.data.key;
          const draggedNode = $getNodeByKey(draggedKey);
          if (!draggedNode || !$isImageNode(draggedNode)) return;

          $mergeImageIntoTarget(targetLexicalNode, draggedNode, draggedNode.getSrc());
        });

        return true;
      } catch (error) {
        console.error('Error parsing dragged lexical data', error);
        return false;
      }
    },
    COMMAND_PRIORITY_HIGH,
  );

  return () => {
    unregisterInsert();
    unregisterPaste();
    unregisterDrop();
  };
}
