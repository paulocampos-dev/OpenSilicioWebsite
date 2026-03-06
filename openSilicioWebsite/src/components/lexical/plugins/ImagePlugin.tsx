import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_HIGH,
    PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { $createImageNode } from '../nodes/ImageNode';
import axios from 'axios';

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
                                    URL.revokeObjectURL(temporaryUrl);
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
    const formData = new FormData();
    formData.append('file', file);

    try {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
        const response = await axios.post(`${apiBaseUrl}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                // Note: we assume auth token is handled globally by axios interceptors
                // established else where in the app, or this endpoint is public/cookie-based
            },
            withCredentials: true,
        });

        // Support either response.data.url or response.data.file.url depending on backend
        return response.data.url || (response.data.file && response.data.file.url) || null;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}
