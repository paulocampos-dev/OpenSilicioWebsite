import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Dialog, IconButton, Zoom } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  // Gallery navigation (optional — omit for single image)
  images?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export function ImageLightbox({
  open,
  onClose,
  src,
  alt = '',
  images,
  currentIndex,
  onNavigate,
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for non-reactive access inside event handlers
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isGallery = !!(images && images.length > 1 && onNavigate);
  const hasPrev = isGallery && currentIndex !== undefined && currentIndex > 0;
  const hasNext =
    isGallery &&
    currentIndex !== undefined &&
    currentIndex < (images?.length ?? 0) - 1;

  const currentSrc =
    isGallery && currentIndex !== undefined ? images![currentIndex] : src;

  // Keep scaleRef in sync with scale state
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const resetTransform = useCallback(() => {
    setScale(1);
    scaleRef.current = 1;
    setPanX(0);
    setPanY(0);
  }, []);

  // Reset zoom when the displayed image changes (gallery navigation)
  useEffect(() => {
    resetTransform();
  }, [currentSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset zoom when the dialog closes
  useEffect(() => {
    if (!open) resetTransform();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Non-passive wheel listener for zoom (passive: false is required to call preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !open) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const next = Math.min(6, Math.max(1, scaleRef.current * factor));
      setScale(next);
      if (next <= 1) {
        setPanX(0);
        setPanY(0);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open]);

  // Keyboard: Escape to close, Arrow keys for gallery navigation
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'ArrowLeft' && hasPrev && onNavigate && currentIndex !== undefined) {
        onNavigate(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && hasNext && onNavigate && currentIndex !== undefined) {
        onNavigate(currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, hasPrev, hasNext, currentIndex, onNavigate, onClose]);

  // --- Drag to pan ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scaleRef.current <= 1) return;
    // Don't start drag when clicking a button (close/nav)
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX, panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanX(dragStart.current.panX + (e.clientX - dragStart.current.x));
    setPanY(dragStart.current.panY + (e.clientY - dragStart.current.y));
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Double-click: toggle between natural size and 2.5× zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (scaleRef.current > 1) {
      resetTransform();
    } else {
      setScale(2.5);
      scaleRef.current = 2.5;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      TransitionComponent={Zoom as any}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'hidden',
          margin: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
        },
      }}
      sx={{
        '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.92)' },
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          userSelect: 'none',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onDoubleClick={handleDoubleClick}
      >
        {/* ── Close button ── */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            zIndex: 10,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* ── Gallery: Previous button ── */}
        {hasPrev && (
          <IconButton
            onClick={() => onNavigate!(currentIndex! - 1)}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
              zIndex: 10,
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        {/* ── Gallery: Next button ── */}
        {hasNext && (
          <IconButton
            onClick={() => onNavigate!(currentIndex! + 1)}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
              zIndex: 10,
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        )}

        {/* ── Zoomable / pannable image ── */}
        {/*
          Transform order: translate → scale
          - translate(panX, panY): moves the image in screen space (no scale distortion)
          - scale(scale): zooms around the transformOrigin (center)
        */}
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          draggable={false}
          style={{
            maxHeight: '90vh',
            maxWidth: '90vw',
            objectFit: 'contain',
            borderRadius: '8px',
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            pointerEvents: 'none', // container handles all pointer events
          }}
        />

        {/* ── Gallery counter (e.g. "2 / 5") ── */}
        {isGallery && currentIndex !== undefined && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 10,
              fontSize: '0.875rem',
              fontFamily: 'sans-serif',
              pointerEvents: 'none',
            }}
          >
            {currentIndex + 1} / {images!.length}
          </Box>
        )}

        {/* ── Zoom level indicator (e.g. "230%") ── */}
        {scale > 1.05 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 10,
              fontSize: '0.75rem',
              fontFamily: 'sans-serif',
              pointerEvents: 'none',
            }}
          >
            {Math.round(scale * 100)}%
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
