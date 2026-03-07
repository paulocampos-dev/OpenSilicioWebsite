import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import CollectionsIcon from '@mui/icons-material/Collections';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import { INSERT_IMAGE_GALLERY_COMMAND } from './ImageGalleryPlugin';
import { $getNearestNodeFromDOMNode, $getNodeByKey, NodeKey, LexicalNode } from 'lexical';
import { $createImageGalleryNode, $isImageGalleryNode } from '../nodes/ImageGalleryNode';
import { $isImageNode } from '../nodes/ImageNode';

export default function ContextMenuPlugin() {
    const [editor] = useLexicalComposerContext();
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
    const [mergeGroupKeys, setMergeGroupKeys] = useState<NodeKey[]>([]);

    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            // Find the editor root element
            const rootElement = editor.getRootElement();
            if (!rootElement || !rootElement.contains(event.target as Node)) {
                return;
            }

            event.preventDefault();

            // Detect adjacency
            editor.read(() => {
                const targetNode = $getNearestNodeFromDOMNode(event.target as Node);
                if (targetNode && ($isImageNode(targetNode) || $isImageGalleryNode(targetNode))) {
                    const nodesToMerge: LexicalNode[] = [targetNode];

                    // Look backwards
                    let prev = targetNode.getPreviousSibling();
                    while (prev && ($isImageNode(prev) || $isImageGalleryNode(prev))) {
                        nodesToMerge.unshift(prev);
                        prev = prev.getPreviousSibling();
                    }

                    // Look forwards
                    let next = targetNode.getNextSibling();
                    while (next && ($isImageNode(next) || $isImageGalleryNode(next))) {
                        nodesToMerge.push(next);
                        next = next.getNextSibling();
                    }

                    if (nodesToMerge.length > 1) {
                        setMergeGroupKeys(nodesToMerge.map(n => n.getKey()));
                    } else {
                        setMergeGroupKeys([]);
                    }
                } else {
                    setMergeGroupKeys([]);
                }
            });

            setContextMenu(
                contextMenu === null
                    ? {
                        mouseX: event.clientX + 2,
                        mouseY: event.clientY - 6,
                    }
                    : null,
            );
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [editor, contextMenu]);

    const handleClose = () => {
        setContextMenu(null);
    };

    const handleInsertGallery = () => {
        handleClose();
        editor.dispatchCommand(INSERT_IMAGE_GALLERY_COMMAND, undefined);
    };

    const handleMergeImages = () => {
        handleClose();
        if (mergeGroupKeys.length === 0) return;

        editor.update(() => {
            const allImages: string[] = [];
            let firstNode: LexicalNode | null = null;

            for (const key of mergeGroupKeys) {
                const node = $getNodeByKey(key);
                if (!node) continue;

                if (!firstNode) firstNode = node;

                if ($isImageNode(node)) {
                    allImages.push((node as any).getSrc());
                } else if ($isImageGalleryNode(node)) {
                    allImages.push(...(node as any).getImages());
                }

                // Do not remove the first node yet, we will replace it
                if (node !== firstNode) {
                    node.remove();
                }
            }

            if (firstNode && allImages.length > 0) {
                const galleryNode = $createImageGalleryNode({
                    images: allImages,
                    layout: 'grid'
                });
                firstNode.replace(galleryNode);
            }
        });
    };

    return (
        <Menu
            open={contextMenu !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
                contextMenu !== null
                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX } as any
                    : undefined
            }
        >
            <MenuItem onClick={handleInsertGallery}>
                <ListItemIcon>
                    <CollectionsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Inserir Galeria de Imagens</ListItemText>
            </MenuItem>
            {mergeGroupKeys.length > 1 && (
                <MenuItem onClick={handleMergeImages}>
                    <ListItemIcon>
                        <MergeTypeIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Agrupar imagens em Galeria</ListItemText>
                </MenuItem>
            )}
        </Menu>
    );
}
