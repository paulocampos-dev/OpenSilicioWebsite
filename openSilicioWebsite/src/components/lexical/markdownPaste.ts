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

// A tag from this set is the signal that pasted HTML actually carries
// structure Lexical's default HTML paste would render differently from
// plain text (headings, lists, quotes, code, links, emphasis, images).
// Absent any of these, the HTML is just a wrapper — many apps attach a bare
// <meta>/<div>/<span> shell to the clipboard even for unformatted text — and
// shouldn't block converting the plain-text payload as markdown instead.
const RICH_HTML_TAG = /<\/?(h[1-6]|ul|ol|li|blockquote|pre|code|a|strong|b|em|i|img)(?:[\s/>])/i;

export function isTrivialHtml(html: string): boolean {
  return !RICH_HTML_TAG.test(html);
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
