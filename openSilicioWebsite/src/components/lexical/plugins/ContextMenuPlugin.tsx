import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import CollectionsIcon from '@mui/icons-material/Collections';
import { INSERT_IMAGE_GALLERY_COMMAND } from './ImageGalleryPlugin';

export default function ContextMenuPlugin() {
    const [editor] = useLexicalComposerContext();
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);

    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            // Find the editor root element
            const rootElement = editor.getRootElement();
            if (!rootElement || !rootElement.contains(event.target as Node)) {
                return;
            }

            event.preventDefault();
            setContextMenu(
                contextMenu === null
                    ? {
                        mouseX: event.clientX + 2,
                        mouseY: event.clientY - 6,
                    }
                    : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                    // Other native context menus might behave different.
                    // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                    null,
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
        </Menu>
    );
}
