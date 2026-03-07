import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    $getNodeByKey,
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_HIGH,
    PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { $createImageNode, $isImageNode } from '../nodes/ImageNode';
import { $createImageGalleryNode, $isImageGalleryNode } from '../nodes/ImageGalleryNode';
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

                    if (imageFiles.length > 1) {
                        // It's a gallery paste!
                        const processGalleryPaste = async () => {
                            const uploadedUrls: string[] = [];
                            for (const file of imageFiles) {
                                if (file.size > 50 * 1024 * 1024) continue;
                                try {
                                    const response = await uploadApi.uploadFile(file);
                                    if (response && response.url) {
                                        uploadedUrls.push(response.url);
                                    }
                                } catch (err) {
                                    console.error(`Error uploading image ${file.name} for gallery paste:`, err);
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
                                alert('Falha ao colar imagens para a galeria.');
                            }
                        };
                        processGalleryPaste();
                        return true;
                    }

                    // Single image paste processing
                    const file = imageFiles[0];
                    if (!file) return false;

                    if (file.size > 50 * 1024 * 1024) {
                        alert(`A imagem ${file.name} excede o limite de tamanho (50MB)`);
                        return true;
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

                            // Upload asynchronously, then check if we should merge with an adjacent image/gallery
                            uploadImage(file).then((url) => {
                                if (url) {
                                    editor.update(() => {
                                        // Re-fetch the node by key so we have its live position in the tree
                                        const node = $getNodeByKey(imageNode.getKey());
                                        if (!node || !$isImageNode(node)) return;

                                        const prevSibling = node.getPreviousSibling();

                                        if ($isImageNode(prevSibling) && !prevSibling.isLoading()) {
                                            // Adjacent ImageNode → merge both into a gallery
                                            const prevUrl = prevSibling.getSrc();
                                            const galleryNode = $createImageGalleryNode({
                                                images: [prevUrl, url],
                                                layout: 'grid',
                                            });
                                            prevSibling.remove();
                                            node.replace(galleryNode);
                                        } else if ($isImageGalleryNode(prevSibling)) {
                                            // Adjacent gallery → append the new image to it
                                            prevSibling.setImages([...prevSibling.getImages(), url]);
                                            node.remove();
                                        } else {
                                            // No adjacent image — just update the URL normally
                                            node.setSrc(url);
                                        }
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
                                // Delay revocation slightly to allow Lexical/React to render the new remote URL image
                                // and prevent the temporary ObjectUrl from breaking before the switch.
                                setTimeout(() => {
                                    URL.revokeObjectURL(temporaryUrl);
                                }, 1000);
                            });
                        }
                    });

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
