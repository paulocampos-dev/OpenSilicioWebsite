import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $createImageGalleryNode } from '../nodes/ImageGalleryNode';
import { uploadApi } from '../../../services/api';

export const INSERT_IMAGE_GALLERY_COMMAND: LexicalCommand<void> = createCommand('INSERT_IMAGE_GALLERY_COMMAND');

export default function ImageGalleryPlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_IMAGE_GALLERY_COMMAND,
            () => {
                // Create an invisible file input element
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';

                input.onchange = async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const files = target.files;

                    if (!files || files.length === 0) return;

                    const fileArray = Array.from(files);
                    const uploadedUrls: string[] = [];

                    // Let the user know the process has started
                    // In a production app, we would dispatch a loading node first,
                    // but for simplicity we will wait for all uploads then insert the final gallery.
                    try {
                        for (const file of fileArray) {
                            if (file.size > 50 * 1024 * 1024) continue; // exceed limit
                            const response = await uploadApi.uploadFile(file);
                            if (response && response.url) {
                                uploadedUrls.push(response.url);
                            }
                        }

                        if (uploadedUrls.length > 0) {
                            editor.update(() => {
                                const selection = $getSelection();
                                if ($isRangeSelection(selection)) {
                                    const galleryNode = $createImageGalleryNode({
                                        images: uploadedUrls,
                                        layout: 'grid',
                                    });
                                    selection.insertNodes([galleryNode]);
                                }
                            });
                        } else {
                            alert('Nenhuma imagem conseguiu ser carregada.');
                        }
                    } catch (err) {
                        console.error("Gallery upload error:", err);
                        alert("Ocorreu um erro ao enviar as imagens da galeria.");
                    }
                };

                // Trigger file picker
                input.click();

                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}
