import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec, ReactCustomBlockRenderProps } from '@blocknote/react';
import { Box, TextField, IconButton } from '@mui/material';
import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Define the config for YouTube block
const youtubeBlockConfig = {
  type: 'youtube' as const,
  propSchema: {
    ...defaultProps,
    videoId: {
      default: '',
    },
    url: {
      default: '',
    },
    width: {
      default: 100, // percentage
    },
  },
  content: 'none' as const,
};

type YouTubeBlockConfig = typeof youtubeBlockConfig;

// Render component for YouTube block
export const YouTubeBlockComponent = (
  props: ReactCustomBlockRenderProps<
    YouTubeBlockConfig['type'],
    YouTubeBlockConfig['propSchema'],
    YouTubeBlockConfig['content']
  >
) => {
  const [isEditing, setIsEditing] = useState(!props.block.props.videoId);
  const [tempUrl, setTempUrl] = useState(props.block.props.url);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const videoId = extractYouTubeId(tempUrl);
    if (videoId) {
      props.editor.updateBlock(props.block, {
        props: { videoId, url: tempUrl },
      });
      setIsEditing(false);
      setError(null);
    } else {
      setError('URL inválida do YouTube');
    }
  };

  const handleCancel = () => {
    if (!props.block.props.videoId) {
      // If no video is set, remove the block
      props.editor.removeBlocks([props.block]);
    } else {
      setIsEditing(false);
      setTempUrl(props.block.props.url);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!props.block || !props.block.props) {
    return <div>Loading...</div>;
  }

  return (
    <div ref={props.contentRef}>
      {isEditing ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1 }}>
          <TextField
            value={tempUrl}
            onChange={(e) => {
              setTempUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            fullWidth
            size="small"
            placeholder="Cole a URL do YouTube (ex: https://youtube.com/watch?v=...)"
            error={!!error}
            helperText={error || 'Pressione Enter para salvar, Esc para cancelar'}
          />
          <IconButton size="small" color="primary" onClick={handleSave}>
            <CheckIcon />
          </IconButton>
          <IconButton size="small" color="error" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            width: `${props.block.props.width}%`,
            paddingBottom: `${(props.block.props.width * 9) / 16}%`, // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            margin: '8px 0',
            '&:hover .edit-button': {
              opacity: 1,
            },
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${props.block.props.videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
          <IconButton
            className="edit-button"
            size="small"
            onClick={() => setIsEditing(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              zIndex: 1,
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </div>
  );
};

// Export the complete block spec
export const YouTubeBlock = createReactBlockSpec(youtubeBlockConfig, {
  render: YouTubeBlockComponent,
  toExternalHTML: (props) => {
    if (!props.block.props.videoId) return <div />;
    return (
      <div
        style={{
          position: 'relative',
          width: `${props.block.props.width}%`,
          paddingBottom: `${(props.block.props.width * 9) / 16}%`,
          height: 0,
          overflow: 'hidden',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${props.block.props.videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    );
  },
  parse: (element) => {
    // Try to parse YouTube iframe or URL
    if (element.tagName === 'IFRAME') {
      const src = element.getAttribute('src');
      if (src) {
        const videoId = extractYouTubeId(src);
        if (videoId) {
          return { videoId, url: src, width: 100 };
        }
      }
    }
    return undefined;
  },
});
