import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $createYouTubeNode, YouTubeNode } from '../nodes/YouTubeNode';

export type InsertYouTubePayload = {
  videoID: string;
};

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<InsertYouTubePayload> =
  createCommand('INSERT_YOUTUBE_COMMAND');

export default function YouTubePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error('YouTubePlugin: YouTubeNode not registered on editor');
    }

    return editor.registerCommand<InsertYouTubePayload>(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const { videoID } = payload;
        const youtubeNode = $createYouTubeNode(videoID);
        $insertNodes([youtubeNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

// Helper function to extract video ID from various YouTube URL formats
export function extractYouTubeVideoID(url: string): string | null {
  // Handle various YouTube URL formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/v/VIDEO_ID

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
