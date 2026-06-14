import {
    DecoratorNode,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import * as React from 'react';
import { Suspense, ReactElement, useState, useRef } from 'react';
import { Box, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { $getNodeByKey } from 'lexical';
import { ImageLightbox } from '../ImageLightbox';
import { $createImageNode } from './ImageNode';

export type GalleryLayout = 'grid' | 'carousel';

export interface ImageGalleryPayload {
    images: string[];
    layout?: GalleryLayout;
    key?: NodeKey;
}

export type SerializedImageGalleryNode = Spread<
    {
        images: string[];
        layout: GalleryLayout;
    },
    SerializedLexicalNode
>;

const ImageGalleryComponent = ({
    images,
    layout,
    nodeKey,
}: {
    images: string[];
    layout: GalleryLayout;
    nodeKey: NodeKey;
}): React.JSX.Element => {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const isEditable = editor.isEditable();

    // Lightbox state (read mode)
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Carousel State
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = direction === 'left' ? -container.clientWidth * 0.8 : container.clientWidth * 0.8;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Drag-to-reorder state (edit mode)
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    // ── Helpers ──────────────────────────────────────────────────────────

    /** Persist a new images array to the Lexical node. Degrades to ImageNode if 1 image remains. */
    const updateImages = (newImages: string[]) => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (!$isImageGalleryNode(node)) return;
            if (newImages.length === 0) {
                node.remove();
            } else if (newImages.length === 1) {
                // Convert the gallery back to a plain ImageNode
                node.replace($createImageNode({ src: newImages[0], altText: '', width: '100%', height: 'auto' }));
            } else {
                node.setImages(newImages);
            }
        });
    };

    // ── Layout toggle ─────────────────────────────────────────────────────

    const handleLayoutChange = (_: React.MouseEvent<HTMLElement>, newLayout: GalleryLayout | null) => {
        if (newLayout !== null && newLayout !== layout) {
            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if ($isImageGalleryNode(node)) node.setLayout(newLayout);
            });
        }
    };

    // ── Per-image actions ─────────────────────────────────────────────────

    const handleDeleteImage = (e: React.MouseEvent, idx: number) => {
        e.stopPropagation();
        updateImages(images.filter((_, i) => i !== idx));
    };

    // ── Drag-and-drop reorder ─────────────────────────────────────────────

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        e.dataTransfer.effectAllowed = 'move';
        setDragIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIdx !== idx) setDragOverIdx(idx);
    };

    const handleDrop = (e: React.DragEvent, toIdx: number) => {
        e.preventDefault();
        const fromIdx = dragIdx;
        setDragIdx(null);
        setDragOverIdx(null);
        if (fromIdx === null || fromIdx === toIdx) return;
        const next = [...images];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        updateImages(next);
    };

    const handleDragEnd = () => {
        setDragIdx(null);
        setDragOverIdx(null);
    };

    // ── Lightbox (read mode) ──────────────────────────────────────────────

    const openLightbox = (index: number) => {
        if (!isEditable) {
            setActiveImageIndex(index);
            setLightboxOpen(true);
        }
    };

    const handleContainerClick = () => {
        if (isEditable) {
            clearSelection();
            setSelected(true);
        }
    };

    // ── Image cell renderer ───────────────────────────────────────────────

    /**
     * Renders a single image cell with:
     * - drag-to-reorder (edit mode)
     * - delete button overlay (edit mode + selected)
     * - blue drop-target outline
     */
    const renderCell = (src: string, idx: number, cellSx: object, imgSx: React.CSSProperties) => {
        const isDraggingThis = dragIdx === idx;
        const isDropTarget = dragOverIdx === idx && dragIdx !== idx;

        return (
            <Box
                key={`${src}-${idx}`}
                onClick={() => openLightbox(idx)}
                draggable={isEditable}
                onDragStart={isEditable ? (e) => handleDragStart(e, idx) : undefined}
                onDragOver={isEditable ? (e) => handleDragOver(e, idx) : undefined}
                onDrop={isEditable ? (e) => handleDrop(e, idx) : undefined}
                onDragEnd={isEditable ? handleDragEnd : undefined}
                sx={{
                    position: 'relative',
                    ...cellSx,
                    cursor: isEditable ? 'grab' : 'zoom-in',
                    opacity: isDraggingThis ? 0.35 : 1,
                    outline: isDropTarget ? '3px solid #0070f3' : '3px solid transparent',
                    outlineOffset: '-3px',
                    transition: 'opacity 0.15s ease, outline-color 0.1s ease',
                }}
            >
                <img
                    src={src}
                    alt={`Gallery Image ${idx + 1}`}
                    loading="lazy"
                    // Prevent browser from starting its own image drag (conflicts with DnD)
                    onDragStart={(e) => e.preventDefault()}
                    style={imgSx}
                />

                {/* Delete button — visible when gallery is selected in edit mode */}
                {isEditable && isSelected && (
                    <IconButton
                        size="small"
                        onClick={(e) => handleDeleteImage(e, idx)}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            color: 'white',
                            width: 26,
                            height: 26,
                            '&:hover': { backgroundColor: 'rgba(180,0,0,0.85)' },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                )}
            </Box>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <>
            <Box
                onClick={handleContainerClick}
                sx={{
                    mb: 3,
                    mt: 3,
                    position: 'relative',
                    borderRadius: 2,
                    border: isSelected && isEditable ? '2px solid #0070f3' : '2px solid transparent',
                    p: isSelected && isEditable ? 1 : 0,
                }}
            >
                {/* Toolbar: layout toggle (shown when selected in edit mode) */}
                {isEditable && isSelected && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -40,
                            right: 0,
                            backgroundColor: 'background.paper',
                            borderRadius: 1,
                            boxShadow: 2,
                            zIndex: 10,
                        }}
                    >
                        <ToggleButtonGroup
                            size="small"
                            value={layout}
                            exclusive
                            onChange={handleLayoutChange}
                            aria-label="Gallery Layout"
                        >
                            <ToggleButton value="grid" aria-label="Grid View">
                                <ViewModuleIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="carousel" aria-label="Carousel View">
                                <ViewCarouselIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                )}

                {/* Grid layout */}
                {layout === 'grid' ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 1.5,
                            width: '100%',
                        }}
                    >
                        {images.map((src, idx) =>
                            renderCell(src, idx,
                                { aspectRatio: '1', overflow: 'hidden', borderRadius: '8px' },
                                { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
                            )
                        )}
                    </Box>
                ) : (
                    <Box sx={{ position: 'relative', width: '100%' }}>
                        <IconButton
                            onClick={(e) => { e.stopPropagation(); scrollCarousel('left'); }}
                            sx={{
                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                zIndex: 5, backgroundColor: 'rgba(255,255,255,0.7)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                                display: images.length > 1 ? 'inline-flex' : 'none'
                            }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>

                        <Box
                            ref={scrollContainerRef}
                            sx={{
                                display: 'flex',
                                overflowX: 'auto',
                                scrollSnapType: 'x mandatory',
                                gap: 2,
                                pb: 1,
                                width: '100%',
                                scrollBehavior: 'smooth',
                                '&::-webkit-scrollbar': { height: 8 },
                                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4 },
                            }}
                        >
                            {images.map((src, idx) =>
                                renderCell(src, idx,
                                    {
                                        scrollSnapAlign: 'center',
                                        flexShrink: 0,
                                        width: '80%',
                                        maxWidth: '400px',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                    },
                                    { width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }
                                )
                            )}
                        </Box>

                        <IconButton
                            onClick={(e) => { e.stopPropagation(); scrollCarousel('right'); }}
                            sx={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                zIndex: 5, backgroundColor: 'rgba(255,255,255,0.7)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                                display: images.length > 1 ? 'inline-flex' : 'none'
                            }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <ImageLightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                src={images[activeImageIndex]}
                alt={`Gallery image ${activeImageIndex + 1}`}
                images={images}
                currentIndex={activeImageIndex}
                onNavigate={setActiveImageIndex}
            />
        </>
    );
};

export class ImageGalleryNode extends DecoratorNode<ReactElement> {
    __images: string[];
    __layout: GalleryLayout;

    static getType(): string {
        return 'image-gallery';
    }

    static clone(node: ImageGalleryNode): ImageGalleryNode {
        return new ImageGalleryNode(node.__images, node.__layout, node.__key);
    }

    static importJSON(serializedNode: SerializedImageGalleryNode): ImageGalleryNode {
        const { images, layout } = serializedNode;
        return $createImageGalleryNode({ images, layout });
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.className = `gallery-layout-${this.__layout}`;
        this.__images.forEach((src) => {
            const img = document.createElement('img');
            img.setAttribute('src', src);
            img.setAttribute('alt', 'Gallery item');
            img.setAttribute(
                'style',
                this.__layout === 'grid'
                    ? 'display: inline-block; width: 33%; object-fit: cover; aspect-ratio: 1; padding: 4px;'
                    : 'display: inline-block; max-height: 400px; padding-right: 16px;'
            );
            element.appendChild(img);
        });
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return null;
    }

    constructor(images: string[], layout: GalleryLayout, key?: NodeKey) {
        super(key);
        this.__images = images;
        this.__layout = layout || 'grid';
    }

    exportJSON(): SerializedImageGalleryNode {
        return {
            images: this.__images,
            layout: this.__layout,
            type: 'image-gallery',
            version: 1,
        };
    }

    setLayout(layout: GalleryLayout): void {
        const writable = this.getWritable();
        writable.__layout = layout;
    }

    getImages(): string[] {
        return this.__images;
    }

    setImages(images: string[]): void {
        const writable = this.getWritable();
        writable.__images = images;
    }

    createDOM(config: any): HTMLElement {
        const div = document.createElement('div');
        const theme = config.theme;
        const className = theme.imageGallery;
        if (className !== undefined) div.className = className;
        div.style.userSelect = 'none';
        return div;
    }

    updateDOM(): false {
        return false;
    }

    decorate(): ReactElement {
        return (
            <Suspense fallback={null}>
                <ImageGalleryComponent
                    images={this.__images}
                    layout={this.__layout}
                    nodeKey={this.getKey()}
                />
            </Suspense>
        );
    }
}

export function $createImageGalleryNode({ images, layout, key }: ImageGalleryPayload): ImageGalleryNode {
    return new ImageGalleryNode(images, layout || 'grid', key);
}

export function $isImageGalleryNode(node: LexicalNode | null | undefined): node is ImageGalleryNode {
    return node instanceof ImageGalleryNode;
}
