import {
    DecoratorNode,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from 'lexical';
import * as React from 'react';
import { Suspense, ReactElement, useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, ToggleButton, ToggleButtonGroup, Dialog, Zoom } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import { TransitionProps } from '@mui/material/transitions';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { $getNodeByKey } from 'lexical';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<unknown, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Zoom ref={ref} {...props as any} />;
});

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

    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Layout mutator for edit mode
    const handleLayoutChange = (event: React.MouseEvent<HTMLElement>, newLayout: GalleryLayout | null) => {
        if (newLayout !== null && newLayout !== layout) {
            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if ($isImageGalleryNode(node)) {
                    node.setLayout(newLayout);
                }
            });
        }
    };

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
                {/* Editor Controls Overlay */}
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

                {/* Gallery Visualizer */}
                {layout === 'grid' ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 1.5,
                            width: '100%',
                        }}
                    >
                        {images.map((src, idx) => (
                            <Box
                                key={idx}
                                onClick={() => openLightbox(idx)}
                                sx={{
                                    aspectRatio: '1',
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    cursor: !isEditable ? 'zoom-in' : 'default',
                                    '& img': {
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }
                                }}
                            >
                                <img src={src} alt={`Gallery Image ${idx + 1}`} loading="lazy" />
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            gap: 2,
                            pb: 1,
                            width: '100%',
                            '&::-webkit-scrollbar': { height: 8 },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4 },
                        }}
                    >
                        {images.map((src, idx) => (
                            <Box
                                key={idx}
                                onClick={() => openLightbox(idx)}
                                sx={{
                                    scrollSnapAlign: 'center',
                                    flexShrink: 0,
                                    width: '80%',
                                    maxWidth: '400px',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    cursor: !isEditable ? 'zoom-in' : 'default',
                                    '& img': {
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block',
                                        objectFit: 'contain',
                                    }
                                }}
                            >
                                <img src={src} alt={`Gallery Image ${idx + 1}`} loading="lazy" />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Lightbox Dialog (Reading Mode only) */}
            <Dialog
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                maxWidth="xl"
                PaperProps={{
                    sx: {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'hidden',
                    }
                }}
                sx={{
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    }
                }}
            >
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, height: '100vh', width: '100vw' }}>
                    <IconButton
                        onClick={() => setLightboxOpen(false)}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            zIndex: 1,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <img
                        src={images[activeImageIndex]}
                        alt={`Lightboxed item`}
                        style={{
                            maxHeight: '90vh',
                            maxWidth: '90vw',
                            objectFit: 'contain',
                            borderRadius: '8px',
                        }}
                        onClick={() => setLightboxOpen(false)}
                    />
                </Box>
            </Dialog>
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
        return $createImageGalleryNode({
            images,
            layout,
        });
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.className = `gallery-layout-${this.__layout}`;

        this.__images.forEach((src) => {
            const img = document.createElement('img');
            img.setAttribute('src', src);
            img.setAttribute('alt', 'Gallery item');
            if (this.__layout === 'grid') {
                img.setAttribute('style', 'display: inline-block; width: 33%; object-fit: cover; aspect-ratio: 1; padding: 4px;');
            } else {
                img.setAttribute('style', 'display: inline-block; max-height: 400px; padding-right: 16px;');
            }
            element.appendChild(img);
        });

        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        // Only worry about converting if copying from another lexical instance
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

    createDOM(config: any): HTMLElement {
        const div = document.createElement('div');
        const theme = config.theme;
        const className = theme.imageGallery;
        if (className !== undefined) {
            div.className = className;
        }
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
