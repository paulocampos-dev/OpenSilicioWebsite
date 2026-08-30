import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getSelection, COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical';
import { $generateNodesFromSerializedNodes, $insertGeneratedNodes } from '@lexical/clipboard';
import { looksLikeMarkdown, markdownToSerializedNodes } from '../markdownPaste';

/**
 * Lexical's default paste handling only understands pasted HTML — pasting
 * raw markdown text (e.g. from a .md file) inserts it as literal characters
 * ("##", "**bold**") instead of formatted content. This plugin intercepts
 * paste, and when the clipboard has no meaningful HTML payload but its
 * plain-text payload looks like markdown, converts it and inserts the
 * result at the current selection instead.
 */
export default function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent) || !event.clipboardData) return false;

        const html = event.clipboardData.getData('text/html');
        const text = event.clipboardData.getData('text/plain');
        if (html.trim() || !text.trim() || !looksLikeMarkdown(text)) return false;

        const serializedNodes = markdownToSerializedNodes(text);
        if (serializedNodes.length === 0) return false;

        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if (!selection) return;
          const nodes = $generateNodesFromSerializedNodes(serializedNodes);
          $insertGeneratedNodes(editor, nodes, selection);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
