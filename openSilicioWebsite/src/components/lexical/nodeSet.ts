import type { Klass, LexicalNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { EquationNode } from './nodes/EquationNode';
import { WikiLinkNode } from './nodes/WikiLinkNode';
import { YouTubeNode } from './nodes/YouTubeNode';
import { ImageNode } from './nodes/ImageNode';
import { ImageGalleryNode } from './nodes/ImageGalleryNode';
import { WaveDromNode } from './nodes/WaveDromNode';
import { EmbedNode } from './nodes/EmbedNode';
import { SevenSegmentNode } from './nodes/SevenSegmentNode';

/**
 * The single source of truth for which node types the editor state can
 * contain. LexicalEditor.tsx (authoring) and LexicalContent.tsx (read-only
 * rendering) must register the identical set, or content referencing an
 * unregistered node type silently fails to render. Import this array in
 * both places instead of declaring it twice.
 */
export const LEXICAL_NODES: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  EquationNode,
  WikiLinkNode,
  YouTubeNode,
  ImageNode,
  ImageGalleryNode,
  // Widgets interativos dos tutoriais. Os plugins de inserção ficam em
  // widgets.tsx e só o editor os monta; os nodes, porém, têm de estar aqui,
  // porque o leitor também precisa saber desserializá-los.
  WaveDromNode,
  EmbedNode,
  SevenSegmentNode,
];
