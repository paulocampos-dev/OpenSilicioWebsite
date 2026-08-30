import { TRANSFORMERS, type TextMatchTransformer } from '@lexical/markdown';
import { $createImageNode, $isImageNode, ImageNode } from './nodes/ImageNode';

/**
 * Standard markdown (`![]()`) has no default transformer in @lexical/markdown
 * because ImageNode is app-specific. Without this, pasted/typed image
 * markdown is silently dropped.
 */
export const IMAGE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) return null;
    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    if (!src) return;
    const imageNode = $createImageNode({ altText: altText ?? '', src });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

/**
 * The full transformer set used for both live markdown-shortcut typing and
 * markdown import/export: @lexical/markdown's defaults (headings, quotes,
 * lists, code, bold/italic/strikethrough/inline-code/highlight, links) plus
 * the custom nodes this editor adds markdown support for.
 *
 * EquationNode is intentionally not covered here: it already converts raw
 * `$..$` / `$$..$$` text to an EquationNode via a live TextNode transform
 * (see EquationPlugin), which also fires on text inserted by markdown
 * import, so no separate transformer is needed for it to round-trip.
 *
 * WikiLinkNode and YouTubeNode are intentionally not covered: this project's
 * markdown content (see conteudo/) doesn't use a markdown syntax for either,
 * and inventing one is a product decision, not a wiring fix.
 */
export const EDITOR_TRANSFORMERS = [...TRANSFORMERS, IMAGE_TRANSFORMER];
