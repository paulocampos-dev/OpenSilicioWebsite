import { $getRoot, type SerializedLexicalNode } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { LEXICAL_NODES } from './nodeSet';
import { EDITOR_TRANSFORMERS } from './transformers';

// Any of these appearing on their own line, or a bold/link span, is a strong
// enough signal that clipboard plain text is markdown source rather than
// prose that happens to contain a stray "#" or "*".
const MARKDOWN_SIGNAL = /^ {0,3}(#{1,6} |>|```|[-*+] |\d+\. )|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\n]+\)/m;

export function looksLikeMarkdown(text: string): boolean {
  return MARKDOWN_SIGNAL.test(text);
}

/**
 * Converts markdown source into serialized Lexical nodes, ready to be
 * rehydrated into a real editor with @lexical/clipboard's
 * $generateNodesFromSerializedNodes + $insertGeneratedNodes.
 *
 * Runs in a throwaway headless editor rather than the target editor because
 * $convertFromMarkdownString clears whatever node it's given — converting
 * in-place would wipe the document instead of producing content to insert
 * at the cursor.
 */
export function markdownToSerializedNodes(markdown: string): SerializedLexicalNode[] {
  const headlessEditor = createHeadlessEditor({ nodes: LEXICAL_NODES, onError: () => {} });
  let serializedNodes: SerializedLexicalNode[] = [];

  headlessEditor.update(
    () => {
      $convertFromMarkdownString(markdown, EDITOR_TRANSFORMERS);
      serializedNodes = $getRoot()
        .getChildren()
        .map((child) => child.exportJSON());
    },
    { discrete: true },
  );

  return serializedNodes;
}
