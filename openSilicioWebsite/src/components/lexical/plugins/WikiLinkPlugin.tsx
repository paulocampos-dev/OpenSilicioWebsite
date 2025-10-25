import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import { $createWikiLinkNode, WikiLinkNode } from '../nodes/WikiLinkNode';
import { $insertNodes } from 'lexical';

export type InsertWikiLinkPayload = {
  url: string;
  text?: string;
  isPending?: boolean;
};

export const INSERT_WIKI_LINK_COMMAND: LexicalCommand<InsertWikiLinkPayload> =
  createCommand('INSERT_WIKI_LINK_COMMAND');

export default function WikiLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([WikiLinkNode])) {
      throw new Error('WikiLinkPlugin: WikiLinkNode not registered on editor');
    }

    return editor.registerCommand<InsertWikiLinkPayload>(
      INSERT_WIKI_LINK_COMMAND,
      (payload) => {
        const { url, text, isPending } = payload;
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const linkNode = $createWikiLinkNode(url, {}, isPending);

          if (text) {
            // If text is provided, create a new text node
            const textNode = $createTextNode(text);
            linkNode.append(textNode);
            $insertNodes([linkNode]);
          } else {
            // If no text, wrap selection in link
            if (selection.isCollapsed()) {
              // No selection, insert link with URL as text
              const textNode = $createTextNode(url);
              linkNode.append(textNode);
              $insertNodes([linkNode]);
            } else {
              // Wrap selected text in link
              selection.insertNodes([linkNode]);
            }
          }

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
