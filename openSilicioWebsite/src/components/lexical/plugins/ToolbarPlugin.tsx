import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Toolbar,
  Tooltip,
  useTheme,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import LinkIcon from '@mui/icons-material/Link';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FunctionsIcon from '@mui/icons-material/Functions';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { INSERT_EQUATION_COMMAND } from './EquationPlugin';
import { INSERT_YOUTUBE_COMMAND, extractYouTubeVideoID } from './YouTubePlugin';

const LowPriority = 1;

const blockTypeToBlockName = {
  bullet: 'Bullet List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
};

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update links
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $findMatchingParent(anchorNode, $isListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection.insertRawText(textContent);
          }
        }
      });
    }
  };

  const insertLink = useCallback(() => {
    if (!isLink) {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  const insertEquation = useCallback(
    (inline: boolean) => {
      const equation = prompt(`Enter LaTeX equation ${inline ? '(inline)' : '(block)'}:`);
      if (equation) {
        editor.dispatchCommand(INSERT_EQUATION_COMMAND, { equation, inline });
      }
    },
    [editor]
  );

  const insertYouTube = useCallback(() => {
    const url = prompt('Enter YouTube URL or Video ID:');
    if (url) {
      const videoID = extractYouTubeVideoID(url);
      if (videoID) {
        editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, { videoID });
      } else {
        alert('URL inválida do YouTube. Use um formato como: https://www.youtube.com/watch?v=VIDEO_ID');
      }
    }
  }, [editor]);

  return (
    <Toolbar
      ref={toolbarRef}
      sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        flexWrap: 'wrap',
        minHeight: 'auto',
      }}
    >
      {/* Undo/Redo */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Desfazer">
          <span>
            <IconButton
              size="small"
              disabled={!canUndo}
              onClick={() => {
                editor.dispatchCommand(UNDO_COMMAND, undefined);
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Refazer">
          <span>
            <IconButton
              size="small"
              disabled={!canRedo}
              onClick={() => {
                editor.dispatchCommand(REDO_COMMAND, undefined);
              }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Block Type Selector */}
      <Select
        value={blockType}
        onChange={(e) => {
          const value = e.target.value;
          switch (value) {
            case 'paragraph':
              formatParagraph();
              break;
            case 'h1':
            case 'h2':
            case 'h3':
              formatHeading(value);
              break;
            case 'bullet':
              formatBulletList();
              break;
            case 'number':
              formatNumberedList();
              break;
            case 'quote':
              formatQuote();
              break;
            case 'code':
              formatCode();
              break;
          }
        }}
        size="small"
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="paragraph">Normal</MenuItem>
        <MenuItem value="h1">Título 1</MenuItem>
        <MenuItem value="h2">Título 2</MenuItem>
        <MenuItem value="h3">Título 3</MenuItem>
        <MenuItem value="bullet">Lista</MenuItem>
        <MenuItem value="number">Lista Numerada</MenuItem>
        <MenuItem value="quote">Citação</MenuItem>
        <MenuItem value="code">Código</MenuItem>
      </Select>

      <Divider orientation="vertical" flexItem />

      {/* Text Formatting */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Negrito">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
            sx={{
              bgcolor: isBold ? 'action.selected' : 'transparent',
            }}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Itálico">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
            sx={{
              bgcolor: isItalic ? 'action.selected' : 'transparent',
            }}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sublinhado">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
            sx={{
              bgcolor: isUnderline ? 'action.selected' : 'transparent',
            }}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tachado">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            }}
            sx={{
              bgcolor: isStrikethrough ? 'action.selected' : 'transparent',
            }}
          >
            <StrikethroughSIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Código">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }}
            sx={{
              bgcolor: isCode ? 'action.selected' : 'transparent',
            }}
          >
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Alignment */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Alinhar à esquerda">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
            }}
          >
            <FormatAlignLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Centralizar">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
            }}
          >
            <FormatAlignCenterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Alinhar à direita">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
            }}
          >
            <FormatAlignRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Justificar">
          <IconButton
            size="small"
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
            }}
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Insert */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Inserir Link">
          <IconButton
            size="small"
            onClick={insertLink}
            sx={{
              bgcolor: isLink ? 'action.selected' : 'transparent',
            }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Inserir Vídeo do YouTube">
          <IconButton size="small" onClick={insertYouTube}>
            <YouTubeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Inserir Equação (inline)">
          <IconButton size="small" onClick={() => insertEquation(true)}>
            <FunctionsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Inserir Equação (bloco)">
          <IconButton size="small" onClick={() => insertEquation(false)}>
            <FunctionsIcon fontSize="small" sx={{ transform: 'scale(1.3)' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>
  );
}
