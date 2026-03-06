import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_HIGH,
    PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { $createImageNode } from '../nodes/ImageNode';
import { uploadApi } from '../../../services/api';

export default function ImagePlugin(): null {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            PASTE_COMMAND,
            (event: ClipboardEvent | InputEvent | KeyboardEvent) => {
                if (!(event instanceof ClipboardEvent)) return false;
                const { clipboardData } = event;
                if (!clipboardData) return false;

                const files = Array.from(clipboardData.files);
                const imageFiles = files.filter((file) => file.type.startsWith('image/'));

                if (imageFiles.length > 0) {
                    event.preventDefault();

                    // Process all pasted images
                    for (const file of imageFiles) {
                        // Validate file size (max 50MB per the backend max)
                        if (file.size > 50 * 1024 * 1024) {
                            alert(`A imagem ${file.name} excede o limite de tamanho (50MB)`);
                            continue;
                        }

                        // Create temporary object URL for immediate display
                        const temporaryUrl = URL.createObjectURL(file);

                        editor.update(() => {
                            const selection = $getSelection();
                            if ($isRangeSelection(selection)) {
                                // Insert node with loading state
                                const imageNode = $createImageNode({
                                    altText: file.name,
                                    src: temporaryUrl,
                                    loading: true,
                                    width: '100%',
                                    height: 'auto',
                                });
                                selection.insertNodes([imageNode]);

                                // Upload array asynchronously
                                uploadImage(file).then((url) => {
                                    if (url) {
                                        editor.update(() => {
                                            // Update the image node with the final URL
                                            imageNode.setSrc(url);
                                        });
                                    } else {
                                        editor.update(() => {
                                            imageNode.remove();
                                            alert(`Falha ao fazer upload da imagem ${file.name}`);
                                        });
                                    }
                                    // Delay revocation slightly to allow Lexical/React to render the new remote URL image
                                    // and prevent the temporary ObjectUrl from breaking before the switch.
                                    setTimeout(() => {
                                        URL.revokeObjectURL(temporaryUrl);
                                    }, 1000);
                                });
                            }
                        });
                    }
                    return true; // Command handled
                }
                return false; // Let lexical handle normal text paste
            },
            COMMAND_PRIORITY_HIGH
        );
    }, [editor]);

    return null;
}

async function uploadImage(file: File): Promise<string | null> {
    try {
        const response = await uploadApi.uploadFile(file);
        // Note: adjusting to the unified backend response type if necessary. 
        // Our centralized uploadApi explicitly returns an object with url.
        return response.url || null;
    } catch (error) {
        console.error('Error uploading image through API service:', error);
        return null;
    }
}
