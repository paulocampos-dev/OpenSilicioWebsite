# Diagrama Anotado (`AnatomiaNode`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ASCII leader-line diagrams in blog posts (which break on mobile) with a new Lexical widget, `AnatomiaNode`, that annotates substrings of an identifier with numbered labels and a legend — pure HTML/CSS, no SVG, reflows at any width.

**Architecture:** A `DecoratorBlockNode` (`os-anatomia`) holding a single JSON5 `fonte` string (`{ texto, partes }`), following the exact pattern already used by `WaveDromNode`/`SevenSegmentNode` in this repo: `.os-widget` shell, `window.prompt`-based editing, dynamic import of third-party parsing libs, registration in `nodeSet.ts` + a toolbar button. A pure function `resolverPartes` (unit-tested) resolves `partes` against `texto` into ordered, non-overlapping runs; the React component renders those runs as an underlined/numbered string plus a legend list.

**Tech Stack:** React 19, Lexical 0.37 (`@lexical/react`), TypeScript strict mode, JSON5 (already a dependency, dynamically imported), Vitest, MUI icons for the toolbar button.

## Global Constraints

- Both apps run TypeScript strict mode; the frontend also enables `exactOptionalPropertyTypes`. No `any`.
- `LEXICAL_NODES` in `openSilicioWebsite/src/components/lexical/nodeSet.ts` is the single source of truth for node registration — the editor and the read-only renderer both import it, and a node missing there makes the whole post fail to render, not just the widget.
- Never inject nodes into the Lexical contenteditable DOM directly; this widget only reads/writes its own `fonte` string via `editor.update()` + `$getNodeByKey`, same as the existing widgets — no DOM manipulation.
- Third-party parsing/rendering libraries must be dynamically imported inside the node's render path, not statically imported at module scope, so posts without the widget don't pay for it (see the comment in `WaveDromNode.tsx`).
- In-code comments and all author-facing UI strings (toolbar tooltips, prompts, error messages) are in Portuguese, matching every other file in `components/lexical/`.
- New CSS goes in `openSilicioWebsite/src/styles/design-system/patterns/widgets.css` (the shared file for all widget styling) using existing `--color-*`/`--font-*` tokens, not new hardcoded colors, so it stays mode-aware automatically.
- The admin form has no autosave; the Salvar submit button is the only reliable write path when editing live posts.
- Verify with the actual build/test commands (`npm run build`, `npm run test`), not `npm run lint` — ESLint's TS parsing is currently broken repo-wide in this project.

---

### Task 1: `resolverPartes` — pure resolution function with unit tests

**Files:**
- Create: `openSilicioWebsite/src/components/lexical/utils/resolverPartes.ts`
- Test: `openSilicioWebsite/src/components/lexical/utils/resolverPartes.test.ts`

**Interfaces:**
- Produces: `Parte = { trecho: string; nota: string }`, `Resolvido` (union of `{ tipo: 'anotado'; inicio: number; fim: number; trecho: string; nota: string; numero: number }` and `{ tipo: 'simples'; inicio: number; fim: number; trecho: string }`), `ResultadoResolucao = { ok: true; trechos: Resolvido[] } | { ok: false; erro: string }`, and `resolverPartes(texto: string, partes: Parte[]): ResultadoResolucao`. Task 2 imports `Parte`, `Resolvido`, `resolverPartes` from this file.

- [ ] **Step 1: Write the failing tests**

Create `openSilicioWebsite/src/components/lexical/utils/resolverPartes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolverPartes } from './resolverPartes'

describe('resolverPartes', () => {
  it('resolves the sky130 example into ordered runs, numbered by source order', () => {
    const resultado = resolverPartes('sky130_fd_sc_hd__inv_1', [
      { trecho: '_1', nota: 'força 1, a versão mais fraca' },
      { trecho: 'inv', nota: 'inversor' },
      { trecho: 'hd', nota: 'high density' },
      { trecho: 'sc', nota: 'standard cell' },
      { trecho: 'fd', nota: 'foundry' },
      { trecho: 'sky130', nota: 'o processo' },
    ])

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return

    const anotados = resultado.trechos.filter((t) => t.tipo === 'anotado')
    expect(anotados.map((t) => [t.trecho, t.numero])).toEqual([
      ['sky130', 6],
      ['fd', 5],
      ['sc', 4],
      ['hd', 3],
      ['inv', 2],
      ['_1', 1],
    ])
  })

  it('returns an error when a trecho does not appear in texto', () => {
    const resultado = resolverPartes('abc', [{ trecho: 'zzz', nota: 'x' }])
    expect(resultado).toEqual({ ok: false, erro: 'trecho "zzz" não aparece em "abc"' })
  })

  it('returns an error when a trecho is ambiguous', () => {
    const resultado = resolverPartes('sky130_fd_sc_hd__inv_1', [{ trecho: '1', nota: 'x' }])
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.erro).toContain('aparece mais de uma vez')
  })

  it('returns an error when two partes overlap', () => {
    const resultado = resolverPartes('abcdef', [
      { trecho: 'abcd', nota: 'x' },
      { trecho: 'cd', nota: 'y' },
    ])
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.erro).toContain('se sobrepõe')
  })

  it('returns the whole texto as a single plain run when partes is empty', () => {
    const resultado = resolverPartes('abc', [])
    expect(resultado).toEqual({
      ok: true,
      trechos: [{ tipo: 'simples', inicio: 0, fim: 3, trecho: 'abc' }],
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (from `openSilicioWebsite/`): `npx vitest run src/components/lexical/utils/resolverPartes.test.ts`
Expected: FAIL — `resolverPartes.ts` does not exist yet (`Cannot find module './resolverPartes'`).

- [ ] **Step 3: Write the implementation**

Create `openSilicioWebsite/src/components/lexical/utils/resolverPartes.ts`:

```ts
/** Uma anotação escrita pelo autor: um trecho da string e a nota que o explica. */
export type Parte = { trecho: string; nota: string }

export type TrechoAnotado = {
  tipo: 'anotado'
  inicio: number
  fim: number
  trecho: string
  nota: string
  /** Posição de `trecho` no array `partes` original (1-based) — é o número
      que aparece tanto sobre o texto quanto na legenda. */
  numero: number
}

export type TrechoSimples = {
  tipo: 'simples'
  inicio: number
  fim: number
  trecho: string
}

export type Resolvido = TrechoAnotado | TrechoSimples

export type ResultadoResolucao =
  | { ok: true; trechos: Resolvido[] }
  | { ok: false; erro: string }

/**
 * Localiza cada `parte.trecho` dentro de `texto` por busca de substring
 * simples, na ordem em que `partes` foi escrito (não a ordem esquerda-
 * -direita da string — o autor pode explicar de trás para frente).
 *
 * Erros: trecho ausente, trecho ambíguo (aparece mais de uma vez — peça
 * mais contexto, ex. `'_1'` em vez de `'1'`), ou trechos que se sobrepõem.
 *
 * Sucesso: os trechos anotados e os intervalos não anotados de `texto`,
 * intercalados na ordem em que aparecem na string (para renderizar a faixa
 * de texto). A legenda é construída pelo chamador a partir do `partes`
 * original — cada entrada bem-sucedida corresponde 1:1 a uma parte.
 */
export function resolverPartes(texto: string, partes: Parte[]): ResultadoResolucao {
  const anotados: TrechoAnotado[] = []

  for (let i = 0; i < partes.length; i++) {
    const { trecho, nota } = partes[i]
    if (!trecho) {
      return { ok: false, erro: `parte ${i + 1} não tem "trecho"` }
    }

    const primeira = texto.indexOf(trecho)
    if (primeira === -1) {
      return { ok: false, erro: `trecho "${trecho}" não aparece em "${texto}"` }
    }

    const ultima = texto.lastIndexOf(trecho)
    if (primeira !== ultima) {
      return {
        ok: false,
        erro: `trecho "${trecho}" aparece mais de uma vez em "${texto}" — inclua mais contexto para desambiguar`,
      }
    }

    const inicio = primeira
    const fim = primeira + trecho.length
    const sobrepoe = anotados.some((a) => inicio < a.fim && fim > a.inicio)
    if (sobrepoe) {
      return { ok: false, erro: `trecho "${trecho}" se sobrepõe a outra parte já anotada` }
    }

    anotados.push({ tipo: 'anotado', inicio, fim, trecho, nota, numero: i + 1 })
  }

  const ordenados = [...anotados].sort((a, b) => a.inicio - b.inicio)

  const trechos: Resolvido[] = []
  let cursor = 0
  for (const a of ordenados) {
    if (a.inicio > cursor) {
      trechos.push({ tipo: 'simples', inicio: cursor, fim: a.inicio, trecho: texto.slice(cursor, a.inicio) })
    }
    trechos.push(a)
    cursor = a.fim
  }
  if (cursor < texto.length) {
    trechos.push({ tipo: 'simples', inicio: cursor, fim: texto.length, trecho: texto.slice(cursor) })
  }

  return { ok: true, trechos }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/lexical/utils/resolverPartes.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/components/lexical/utils/resolverPartes.ts openSilicioWebsite/src/components/lexical/utils/resolverPartes.test.ts
git commit -m "$(cat <<'EOF'
feat(lexical): add resolverPartes for annotated-string diagrams

Pure function that matches each authored trecho against the base string,
detecting missing/ambiguous/overlapping annotations. Backs the new
AnatomiaNode widget.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YHUT34XDiLVrjww8ENe4rx
EOF
)"
```

---

### Task 2: `AnatomiaNode` widget — node, component, CSS, wiring

**Files:**
- Create: `openSilicioWebsite/src/components/lexical/nodes/AnatomiaNode.tsx`
- Create: `openSilicioWebsite/src/components/lexical/plugins/AnatomiaPlugin.tsx`
- Modify: `openSilicioWebsite/src/components/lexical/nodeSet.ts`
- Modify: `openSilicioWebsite/src/components/lexical/widgets.tsx`
- Modify: `openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx`
- Modify: `openSilicioWebsite/src/styles/design-system/patterns/widgets.css`

**Interfaces:**
- Consumes: `resolverPartes`, `Parte`, `Resolvido` from `../utils/resolverPartes` (Task 1).
- Produces: `AnatomiaNode` class, `$createAnatomiaNode(fonte: string): AnatomiaNode`, `$isAnatomiaNode(node): node is AnatomiaNode`, `ANATOMIA_EXEMPLO: string` from `nodes/AnatomiaNode.tsx`; `INSERT_ANATOMIA_COMMAND: LexicalCommand<{ fonte?: string }>` from `plugins/AnatomiaPlugin.tsx`.

- [ ] **Step 1: Create the node + component**

Create `openSilicioWebsite/src/components/lexical/nodes/AnatomiaNode.tsx`:

```tsx
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import { resolverPartes, type Parte } from '../utils/resolverPartes';

/** Fonte de exemplo: a própria quebra do nome sky130 usada no post original.
    Serve de documentação viva do formato quando o autor insere um diagrama
    vazio. */
export const ANATOMIA_EXEMPLO = `{
  texto: 'sky130_fd_sc_hd__inv_1',
  partes: [
    { trecho: '_1', nota: 'força 1, a versão mais fraca' },
    { trecho: 'inv', nota: 'inversor' },
    { trecho: 'hd', nota: 'high density, a biblioteca de alta densidade' },
    { trecho: 'sc', nota: 'standard cell' },
    { trecho: 'fd', nota: 'foundry, quer dizer que a biblioteca é da própria SkyWater' },
    { trecho: 'sky130', nota: 'o processo' },
  ],
}`;

type FonteAnatomia = { texto: string; partes: Parte[] };

type ResultadoCarga =
  | { ok: true; texto: string; partes: Parte[] }
  | { ok: false; erro: string };

/* O JSON5 é leve, mas a política do repo (ver WaveDromNode.tsx) é que
   nenhuma dependência de terceiros entra por import estático num node —
   assim só quem lê um post com este widget baixa o parser. */
async function carregar(fonte: string): Promise<ResultadoCarga> {
  try {
    const JSON5 = await import('json5').then((m) => m.default);
    const origem = JSON5.parse(fonte) as Partial<FonteAnatomia>;
    if (typeof origem.texto !== 'string' || origem.texto.length === 0) {
      return { ok: false, erro: 'fonte precisa de um campo "texto" (string não vazia)' };
    }
    if (!Array.isArray(origem.partes)) {
      return { ok: false, erro: 'fonte precisa de um campo "partes" (lista)' };
    }
    return { ok: true, texto: origem.texto, partes: origem.partes };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, erro: msg };
  }
}

function AnatomiaComponent({
  className,
  format,
  nodeKey,
  fonte,
}: {
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  fonte: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [carregado, setCarregado] = React.useState<ResultadoCarga | null>(null);

  React.useEffect(() => {
    let vivo = true;
    void carregar(fonte).then((r) => {
      if (vivo) setCarregado(r);
    });
    return () => {
      vivo = false;
    };
  }, [fonte]);

  const editavel = editor.isEditable();

  const editar = () => {
    const nova = window.prompt('Fonte do diagrama anotado (JSON5):', fonte);
    if (nova === null) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnatomiaNode(node)) node.setFonte(nova);
    });
  };

  const remover = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  const resultado = carregado && carregado.ok ? resolverPartes(carregado.texto, carregado.partes) : null;

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="os-widget">
        {editavel && (
          <div className="os-widget__barra">
            <span>Diagrama anotado</span>
            <span>
              <button type="button" onClick={editar}>editar</button>{' '}
              <button type="button" onClick={remover}>remover</button>
            </span>
          </div>
        )}
        {carregado === null ? (
          <div className="os-widget__corpo">Carregando diagrama...</div>
        ) : !carregado.ok ? (
          <div className="os-widget__erro">
            Não consegui ler a fonte do diagrama: {carregado.erro}
          </div>
        ) : resultado && !resultado.ok ? (
          <div className="os-widget__erro">{resultado.erro}</div>
        ) : (
          <div className="os-widget__corpo os-anatomia">
            <div className="os-anatomia__string">
              {resultado?.ok &&
                resultado.trechos.map((t, i) =>
                  t.tipo === 'simples' ? (
                    <span key={i} className="os-anatomia__sep">{t.trecho}</span>
                  ) : (
                    <span key={i} className="os-anatomia__tok">
                      {t.trecho}
                      <sup className="os-anatomia__num">{t.numero}</sup>
                    </span>
                  ),
                )}
            </div>
            <div className="os-anatomia__legenda">
              {carregado.partes.map((p, i) => (
                <div key={i} className="os-anatomia__item">
                  <span className="os-anatomia__badge">{i + 1}</span>
                  <span className="os-anatomia__trecho">{p.trecho}</span>
                  <span className="os-anatomia__nota">{p.nota}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedAnatomiaNode = Spread<{ fonte: string }, SerializedDecoratorBlockNode>;

function converterElemento(domNode: HTMLElement): null | DOMConversionOutput {
  const fonte = domNode.getAttribute('data-os-anatomia');
  return fonte ? { node: $createAnatomiaNode(fonte) } : null;
}

export class AnatomiaNode extends DecoratorBlockNode {
  __fonte: string;

  static getType(): string {
    return 'os-anatomia';
  }

  static clone(node: AnatomiaNode): AnatomiaNode {
    return new AnatomiaNode(node.__fonte, node.__format, node.__key);
  }

  static importJSON(serialized: SerializedAnatomiaNode): AnatomiaNode {
    const node = $createAnatomiaNode(serialized.fonte);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedAnatomiaNode {
    return {
      ...super.exportJSON(),
      type: 'os-anatomia',
      version: 1,
      fonte: this.__fonte,
    };
  }

  constructor(fonte: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__fonte = fonte;
  }

  updateDOM(): false {
    return false;
  }

  isTopLevel(): true {
    return true;
  }

  isInline(): false {
    return false;
  }

  getFonte(): string {
    return this.__fonte;
  }

  setFonte(fonte: string): void {
    const writable = this.getWritable();
    writable.__fonte = fonte;
  }

  getTextContent(): string {
    return this.__fonte;
  }

  decorate(_editor: unknown, config: EditorConfig): React.JSX.Element {
    const tema = config.theme.embedBlock || {};
    return (
      <AnatomiaComponent
        className={{ base: tema.base || '', focus: tema.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
        fonte={this.__fonte}
      />
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-os-anatomia')
          ? { conversion: converterElemento, priority: 2 }
          : null,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-os-anatomia', this.__fonte);
    return { element };
  }
}

export function $createAnatomiaNode(fonte: string): AnatomiaNode {
  return new AnatomiaNode(fonte);
}

export function $isAnatomiaNode(
  node: LexicalNode | null | undefined,
): node is AnatomiaNode {
  return node instanceof AnatomiaNode;
}
```

Note: `getTextContent()` returns the raw `fonte` (not the parsed `texto`), matching `WaveDromNode`'s convention — parsing is async (dynamic `import('json5')`) and `getTextContent()` must be synchronous.

- [ ] **Step 2: Add the CSS**

In `openSilicioWebsite/src/styles/design-system/patterns/widgets.css`, after the `— decodificador de 7 segmentos —` block (before the final `@media (prefers-reduced-motion: reduce)` rule), add:

```css
/* — diagrama anotado — */
.os-anatomia__string {
  font-family: var(--font-mono);
  font-size: 18px;
  letter-spacing: 0.01em;
  word-break: break-all;
}

.os-anatomia__sep { color: var(--color-text-faint); }

.os-anatomia__tok {
  color: var(--color-accent-ink);
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: 1px;
}

.os-anatomia__num {
  font-size: 11px;
  vertical-align: super;
  margin-left: 1px;
  font-family: var(--font-heading, inherit);
}

.os-anatomia__legenda {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-line);
  display: grid;
  gap: 10px;
}

.os-anatomia__item {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.os-anatomia__badge {
  font-family: var(--font-heading, inherit);
  font-size: 12px;
  color: var(--color-bg);
  background: var(--color-accent);
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  flex: none;
  margin-top: 2px;
}

.os-anatomia__trecho {
  font-family: var(--font-mono);
  color: var(--color-accent-ink);
  font-size: 14px;
}

.os-anatomia__nota {
  color: var(--color-text-muted);
  font-size: 14px;
}
```

- [ ] **Step 3: Create the insertion plugin**

Create `openSilicioWebsite/src/components/lexical/plugins/AnatomiaPlugin.tsx`:

```tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import {
  $createAnatomiaNode,
  AnatomiaNode,
  ANATOMIA_EXEMPLO,
} from '../nodes/AnatomiaNode';

export type InserirAnatomiaPayload = { fonte?: string };

export const INSERT_ANATOMIA_COMMAND: LexicalCommand<InserirAnatomiaPayload> =
  createCommand('INSERT_ANATOMIA_COMMAND');

export default function AnatomiaPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([AnatomiaNode])) {
      throw new Error('AnatomiaPlugin: AnatomiaNode não registrado no editor');
    }

    return editor.registerCommand<InserirAnatomiaPayload>(
      INSERT_ANATOMIA_COMMAND,
      ({ fonte }) => {
        $insertNodes([$createAnatomiaNode(fonte || ANATOMIA_EXEMPLO)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
```

- [ ] **Step 4: Register the node in `nodeSet.ts`**

In `openSilicioWebsite/src/components/lexical/nodeSet.ts`, add the import next to the other widget nodes:

```ts
import { SevenSegmentNode } from './nodes/SevenSegmentNode';
import { AnatomiaNode } from './nodes/AnatomiaNode';
```

And add `AnatomiaNode` to the `LEXICAL_NODES` array, after `SevenSegmentNode`:

```ts
  WaveDromNode,
  EmbedNode,
  SevenSegmentNode,
  AnatomiaNode,
];
```

- [ ] **Step 5: Mount the plugin in `widgets.tsx`**

In `openSilicioWebsite/src/components/lexical/widgets.tsx`, add the import:

```ts
import AnatomiaPlugin from './plugins/AnatomiaPlugin';
```

And add it inside `OsWidgetPlugins`:

```tsx
export function OsWidgetPlugins() {
  return (
    <>
      <WaveDromPlugin />
      <EmbedPlugin />
      <SevenSegmentPlugin />
      <AnatomiaPlugin />
    </>
  );
}
```

- [ ] **Step 6: Add the toolbar button**

In `openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx`:

Add the icon import next to the other widget icons (after `import MemoryIcon from '@mui/icons-material/Memory';`):

```ts
import AccountTreeIcon from '@mui/icons-material/AccountTree';
```

Add the command import next to `INSERT_SEVEN_SEGMENT_COMMAND`'s import:

```ts
import { INSERT_ANATOMIA_COMMAND } from './AnatomiaPlugin';
```

Add the callback next to `inserirSeteSegmentos` (after its `useCallback` block):

```tsx
  const inserirAnatomia = useCallback(() => {
    editor.dispatchCommand(INSERT_ANATOMIA_COMMAND, {});
  }, [editor]);
```

Add the button in the widgets `Box`, after the seven-segment `Tooltip`/`IconButton` pair:

```tsx
        <Tooltip title="Inserir Diagrama Anotado">
          <IconButton size="small" onClick={inserirAnatomia}>
            <AccountTreeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
```

- [ ] **Step 7: Run the unit tests**

Run (from `openSilicioWebsite/`): `npm run test`
Expected: PASS — all existing tests plus the 5 `resolverPartes` tests from Task 1.

- [ ] **Step 8: Run the build to catch type errors**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 9: Manual verification in the local editor**

Start the dev stack per `README/DEVELOPMENT_GUIDE.md` (or `scripts/development/start.sh`), log into the admin, open the post editor (new or existing post, category other than "Projetos" so there's a single editor), and check:

1. Click the new toolbar button (tree icon, tooltip "Inserir Diagrama Anotado"). The widget appears pre-filled with the `sky130_fd_sc_hd__inv_1` example, rendering the string with 6 underlined/numbered tokens and a 6-row legend below.
2. Click "editar", change a `nota` in the prompt, confirm — the legend text updates.
3. Click "editar" again, change a `trecho` to `'1'` (bare, ambiguous with the `1` inside `sky130`), confirm — the widget shows the inline error box with "aparece mais de uma vez".
4. Click "editar" once more, restore the working example, confirm — the widget renders correctly again.
5. Resize the browser window (or open dev tools' responsive mode) to ~360px wide — the string and legend reflow with no horizontal scroll and no clipped text.
6. Click "remover" — the widget is deleted from the document.
7. Click Salvar with the widget present, reload the editor, confirm the widget reloads with its saved `fonte` intact.

- [ ] **Step 10: Commit**

```bash
git add openSilicioWebsite/src/components/lexical/nodes/AnatomiaNode.tsx \
        openSilicioWebsite/src/components/lexical/plugins/AnatomiaPlugin.tsx \
        openSilicioWebsite/src/components/lexical/nodeSet.ts \
        openSilicioWebsite/src/components/lexical/widgets.tsx \
        openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx \
        openSilicioWebsite/src/styles/design-system/patterns/widgets.css
git commit -m "$(cat <<'EOF'
feat(lexical): add AnatomiaNode, a responsive annotated-string diagram

Replaces the ASCII leader-line diagrams that break on mobile with a widget
that underlines/numbers substrings and lists them in a legend below — pure
HTML/CSS, no SVG, reflows at any width. Follows the existing WaveDromNode/
SevenSegmentNode widget pattern (DecoratorBlockNode, .os-widget shell,
window.prompt editing, dynamic import of JSON5).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YHUT34XDiLVrjww8ENe4rx
EOF
)"
```

---

### Task 3: Document the widget in `CLAUDE.md` for other sessions

**Files:**
- Modify: `/home/pcampos/Projects/lsi/OpenSilicioWebsite/CLAUDE.md`

**Interfaces:**
- Consumes: nothing new — this is documentation of Task 2's finished shape.

- [ ] **Step 1: Add a bullet to "The Lexical editor and the admin panel"**

In `CLAUDE.md`, in the section `## The Lexical editor and the admin panel`, add a new bullet after the one about "Category 'Projetos' renders three editors" and before the "Wiki term association" bullet:

```markdown
- **`AnatomiaNode` (`os-anatomia`) replaces ASCII leader-line diagrams.**
  Source is JSON5: `{ texto, partes: [{ trecho, nota }] }`. Each `trecho` is
  located in `texto` by plain substring search (`resolverPartes` in
  `components/lexical/utils/`), not by explicit index — so a `trecho` that
  also occurs elsewhere in `texto` (e.g. a bare `'1'` inside `'sky130'`) is
  rejected as ambiguous; give it more context instead (`'_1'`). Legend order
  follows the `partes` array, not left-to-right string position, so an
  author can explain a name back-to-front like the original sky130 post
  did. No SVG, no measured pixel positions — it's plain text that wraps.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(agents): record the AnatomiaNode diagram widget pitfalls

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01YHUT34XDiLVrjww8ENe4rx
EOF
)"
```

---

### Task 4: Roll out to the two live posts

**Files:** none (content-only change via the admin UI, in the production database).

**Interfaces:** none — this task drives the already-deployed admin UI in a browser. It only makes sense to run after Task 2 has shipped to production (i.e. after this branch is merged/deployed), since the widget must exist in the running app before it can be inserted into a post.

- [ ] **Step 1: Locate the two flagged posts**

In the admin's post list, find the sky130/standard-cell post (contains the string `sky130_fd_sc_hd__inv_1` and the GitHub link `github.com/google/skywater-pdk-libs-sky130_fd_sc_hd/tree/main/cells/inv`) and open it in the editor. Note its slug/URL for reference.

- [ ] **Step 2: Replace the ASCII code block with `AnatomiaNode`**

Delete the `plain`-language code block containing the ASCII tree. In its place, click the "Inserir Diagrama Anotado" toolbar button, then "editar" to replace the default example with a `fonte` matching the original content:

```js
{
  texto: 'sky130_fd_sc_hd__inv_1',
  partes: [
    { trecho: '_1', nota: 'força 1, a versão mais fraca' },
    { trecho: 'inv', nota: 'inversor' },
    { trecho: 'hd', nota: 'high density, a biblioteca de alta densidade' },
    { trecho: 'sc', nota: 'standard cell' },
    { trecho: 'fd', nota: 'foundry, quer dizer que a biblioteca é da própria SkyWater' },
    { trecho: 'sky130', nota: 'o processo' },
  ],
}
```

- [ ] **Step 3: Verify and save**

Confirm the widget renders correctly in the editor preview, resize the browser to a narrow width to confirm no overflow, click Salvar, then reload the published post page (not just the editor) and re-check on both a normal and a narrow viewport.

- [ ] **Step 4: Repeat for the second flagged post, if it has the same or a similar ASCII diagram**

Check whether the second screenshot (the `.cdl`/circuit-listing post) contains its own ASCII leader-line diagram elsewhere in the same post, or whether it's the same post as Step 1 (the two screenshots may be two scrolled views of one post — confirm this before editing anything twice). If a separate diagram exists, repeat Steps 2–3 for it with a `fonte` matching that diagram's actual content.

---

## Self-Review Notes

- **Spec coverage:** node/wiring (Task 2), pure resolver + tests (Task 1), error handling for not-found/ambiguous/overlapping `trecho` (Task 1 tests + Task 2's error rendering), CLAUDE.md documentation (Task 3), rollout (Task 4). All spec sections have a task.
- **Deviation from the spec doc:** `getTextContent()` returns the raw `fonte` string, not the parsed `texto` — matches `WaveDromNode`'s existing convention (parsing is async via dynamic `import('json5')`, and `getTextContent()` must stay synchronous). Noted inline in Task 2, Step 1.
- **Type consistency checked:** `Parte`/`Resolvido`/`ResultadoResolucao` (Task 1) are the exact names imported in Task 2; `INSERT_ANATOMIA_COMMAND`'s payload type `{ fonte?: string }` matches its only call site (`editor.dispatchCommand(INSERT_ANATOMIA_COMMAND, {})` in the toolbar).
