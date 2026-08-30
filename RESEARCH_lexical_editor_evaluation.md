# Editor evaluation: is Lexical the problem, or is the wiring?

Research date: 2026-08-30. Scope: should OpenSilício replace its Lexical-based
rich text editor, and if not, what should change instead. Central deciding
criterion per the brief: how painful is it to build and maintain a custom
interactive block node (Wokwi/SiliWiz iframes, WaveDrom diagrams, small React
widgets like a 7-segment decoder), both in the WYSIWYG editor and in the
public read-only renderer.

---

## 1. Executive summary

**Recommendation: stay on Lexical.** Wire up the already-installed
`@lexical/markdown` package (paste/import + export), and extract the two
duplicated custom-node arrays in `LexicalEditor.tsx` /
`LexicalContent.tsx` into one shared, compiler-enforced module. Do not
migrate to a different library. The evidence for this: the project's git
history shows it already burned significant effort on editor churn once —
TipTap → BlockNote → Lexical, three editors in 11 days (Oct 14–25, 2025),
with a full content wipe in between — and the specific forward requirement
(interactive React widgets as block nodes) is *already proven working* in
the current Lexical setup via `DecoratorNode` (see `EquationNode.tsx`,
`YouTubeNode.tsx`, `ImageNode.tsx`, `ImageGalleryNode.tsx`, all live in
production). The two real, current pain points — markdown paste is broken,
and the node registration is duplicated with no compiler safety — are both
fixable in days, not weeks, without touching the 3,300 lines of proven
custom-node code. TipTap 3 is flagged as the strongest alternative *if* a
switch is ever warranted later, mainly because of its first-party
`@tiptap/static-renderer` (a genuine "render without an editor instance"
API) and its new first-party `@tiptap/markdown` extension — but nothing in
the current codebase justifies paying that migration cost now.

---

## 2. Current-state findings

### 2.1 `@lexical/markdown` is a dead dependency — quantified

`@lexical/markdown@^0.37.0` is declared in
`openSilicioWebsite/package.json` and physically present in
`node_modules/@lexical/markdown`, but grepping `src/` for
`MarkdownShortcutPlugin`, `@lexical/markdown`, or `TRANSFORMERS` returns
zero hits. `LexicalEditor.tsx` registers `HistoryPlugin`, `LinkPlugin`,
`ListPlugin`, `EquationPlugin`, `WikiLinkPlugin`, `YouTubePlugin`,
`ImagePlugin`, `ImageGalleryPlugin`, `ContextMenuPlugin` — no markdown
plugin at all.

What the package actually offers (from
`node_modules/@lexical/markdown/index.d.ts` and `MarkdownTransformers.d.ts`,
version 0.37.0, matching the repo's pin):

- `$convertFromMarkdownString(markdown, transformers?, node?, ...)` and
  `$convertToMarkdownString(transformers?, node?, ...)` — programmatic,
  editor-command-driven conversion, not automatic.
- `registerMarkdownShortcuts(editor, transformers)` — the actual "type `##`
  and get an H2" live-typing behavior; this is a separate opt-in call, not
  paste handling.
- Default `TRANSFORMERS` cover headings, quotes, code blocks, lists
  (ordered/unordered/check), bold/italic/strikethrough/inline-code/highlight
  text formats, and links — i.e., exactly the node types
  `LexicalEditor.tsx` already registers (`HeadingNode`, `QuoteNode`,
  `ListNode`/`ListItemNode`, `CodeNode`/`CodeHighlightNode`, `LinkNode`).
- Critically: **there is no default transformer for any of the 5 custom
  nodes** (`EquationNode`, `WikiLinkNode`, `YouTubeNode`, `ImageNode`,
  `ImageGalleryNode`). Each `Transformer` (`ElementTransformer` /
  `MultilineElementTransformer` / `TextMatchTransformer`) is a hand-written
  object with a `regExp`, a `replace()` (import) and an `export()` function
  — the same shape of work already done in this repo for e.g.
  `WikiLinkPlugin.tsx` (68 lines) and `EquationPlugin.tsx` (93 lines) to
  wire a custom node into the editor's command system.

What wiring this up concretely takes:

1. Import `registerMarkdownShortcuts` (or `MarkdownShortcutPlugin` from
   `@lexical/react/LexicalMarkdownShortcutPlugin`) and the default
   `TRANSFORMERS` array into `LexicalEditor.tsx`. This alone fixes live
   markdown-shortcut typing (`##`, `**bold**`, `- list`, etc.) for the
   already-registered standard nodes — genuinely a few lines.
2. Fix **paste**: Lexical's default clipboard paste already interprets
   pasted *HTML* correctly (confirmed by `conteudo/README.md`, which exists
   specifically because raw `.md` pasted as plain text produces literal
   `##`/`**`). Getting raw markdown text pasted from clipboard to convert
   requires intercepting `PASTE_COMMAND` and calling
   `$convertFromMarkdownString()` when the clipboard's plain-text payload
   looks like markdown and no richer HTML payload is present — this is the
   part that isn't automatic out of the box and needs a small custom
   plugin, following the same pattern as `WikiLinkPlugin`/`EquationPlugin`.
3. Write custom transformers for the 5 custom nodes if markdown import/export
   should cover them (e.g., `![alt](url)` → `ImageNode`, a delimiter for
   equations, a syntax for wiki links). Standard `TRANSFORMERS` does not
   include an image transformer at all, so even image markdown needs a
   hand-written one.
4. Optional: wire `$convertToMarkdownString` for an admin-side "export as
   markdown" affordance, which would let the `conteudo/` external
   `build.js` (.md → .html → paste) pipeline be retired entirely for future
   content — authors could paste `.md` directly once step 2 lands.

Net: this is a real but bounded piece of work — a paste-command plugin plus
4–5 small transformer objects, each roughly the size of the existing
`WikiLinkPlugin.tsx`/`EquationPlugin.tsx`. Realistic estimate: 2–4 days
including tests, not the "just add a plugin" one-liner it might look like
from the outside, but nowhere near a rewrite.

### 2.2 TipTap dead-code archaeology

`openSilicioWebsite/src/components/RichTextEditor.tsx` (a full TipTap 2
implementation, 215 lines at introduction) is genuinely dead: `grep -rn
"RichTextEditor" src/` only matches its own file (the component/interface
declarations), imported by nothing.

Git history shows this was **not** an abandoned migration *to* Lexical that
never got wired up — it was a real, working editor that got replaced twice:

| Commit | Date | Event |
|---|---|---|
| `d887770` "Primeiro Commit" | 2025-10-14 | Initial commit. `RichTextEditor.tsx` (TipTap) exists **and is actually imported and used** in `pages/admin/BlogForm.tsx` (`import RichTextEditor from '../../components/RichTextEditor'`, used at line 142). Five `@tiptap/*` deps present from day one. |
| `e633184` "Implement BlockNote integration and remove content_type fields" | 2025-10-18 (4 days later) | TipTap ripped out, replaced with `BlockNoteEditor.tsx`/`BlockNoteContent.tsx`. Adds `backend/src/migrations/005_remove_content_type.sql`, which **`TRUNCATE`s** `blog_posts`, `education_resources`, and `wiki_entries` "to start fresh with BlockNote JSON format" (see §2.3). |
| `74178d0` "Add LaTeX and YouTube block support in BlockNote editor" | 2025-10-22 | Custom interactive blocks (LaTeX, YouTube) added to BlockNote — i.e., an attempt at exactly the kind of widget authoring this evaluation is about. |
| `a8b2bb5` "Refactor BlockNote editor by removing LaTeX and YouTube block support" | 2025-10-23 (1 day later) | Those same custom blocks are deleted again (`BlockNoteContent.tsx`, `BlockNoteEditor.tsx`, `blockNoteSchema.ts`, `LatexBlock.tsx` [181 lines removed], `YouTubeBlock.tsx` [221 lines removed]) — "simplifying," "streamline." Net: -612/+85 lines. This is the closest thing in the repo's history to a direct signal that custom block authoring was the friction point that triggered the next migration. |
| `59fc3e5` "Implement migration to Lexical editor and update content handling" | 2025-10-25 (2 days later) | BlockNote ripped out entirely, replaced by the current Lexical implementation. Adds `backend/src/scripts/migrateToLexical.ts` (264 lines) to convert existing BlockNote JSON to Lexical JSON — i.e., this migration *did* have real content to convert, unlike a future Lexical migration would (see §2.3). |

So the actual sequence is **TipTap (used) → BlockNote (used, custom blocks
added then immediately removed) → Lexical (current)**, three editor
libraries in 11 days, with a destructive content truncation in the middle.
The five remaining `@tiptap/*` deps in `package.json` and the orphaned
`RichTextEditor.tsx` are simply leftovers never cleaned up after the first
swap — safe to delete regardless of what this evaluation recommends.

This history is the strongest concrete evidence in the repo for treating
"just switch libraries" as a nontrivial-risk move: the last two times this
project changed rich-text editors, each swap took under a week of wall
time but did so by discarding real work (custom LaTeX/YouTube blocks) and,
in the TipTap→BlockNote transition, real content.

### 2.3 BlockNote migration-005 archaeology

`backend/src/migrations/005_remove_content_type.sql` (read directly):

```sql
-- Migration: Remove content_type column and clear existing content for BlockNote
-- Description: Removes content_type from all tables and clears existing content
-- to start fresh with BlockNote JSON format

ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_type;
TRUNCATE TABLE blog_posts CASCADE;

ALTER TABLE education_resources DROP COLUMN IF EXISTS content_type;
TRUNCATE TABLE education_resources CASCADE;

ALTER TABLE wiki_entries DROP COLUMN IF EXISTS content_type;
TRUNCATE TABLE wiki_entries CASCADE;

DELETE FROM site_settings WHERE key IN (
  'about_content_type', 'about_mission_type', 'about_vision_type', 'about_history_type'
);
```

The prior architecture stored a `content_type` discriminator (implying it
supported more than one content format — likely markdown/HTML alongside a
rich JSON format, consistent with the commit message "replacing previous
markdown and HTML rendering methods"). Moving to BlockNote's block-JSON
format wasn't considered worth writing a converter for — the migration just
truncates all content tables and drops the discriminator column outright.
Three days later BlockNote itself was abandoned for Lexical, and *that*
migration (`59fc3e5`) *did* write a real converter (`migrateToLexical.ts`),
suggesting there was more real content to preserve by then (or more
willingness to write the converter) than at the earlier TipTap→BlockNote
step. Either way, this confirms the project has a working precedent for
both "wipe and restart" and "write a converter" migration strategies,
depending on how much content exists at the time — directly relevant to
§6, since today only 3 rows of real content exist and a converter (not a
wipe) is clearly the easier and now-cheaper option the longer this is
deferred.

### 2.4 Dual-registration architecture risk

`LexicalEditor.tsx` (authoring) and `LexicalContent.tsx` (public read-only
render) each independently declare, as separate literal array values, the
exact same 12-entry `nodes: [...]` list passed to their own
`LexicalComposer`/`initialConfig` (`HeadingNode, QuoteNode, ListNode,
ListItemNode, CodeNode, CodeHighlightNode, LinkNode, EquationNode,
WikiLinkNode, YouTubeNode, ImageNode, ImageGalleryNode` — confirmed
byte-identical between both files). There is no shared constant; nothing
in TypeScript's type system or the build enforces that the two stay in
sync. If a node is added to one and not the other, Lexical will fail to
parse editor-state JSON referencing an unregistered node type — a runtime
failure, not a compile-time one, and it manifests as silently-missing
content rather than a build error.

Worth noting in fairness to Lexical's node-authoring model itself: reading
`EquationNode.tsx` (113 lines) shows the actual React-rendering path,
`decorate()`, is *shared* between editing and read-only — the same
component tree renders in both `LexicalEditorInner` and
`LexicalContentInner` once the node class is registered. So the pain here
is narrowly the **node-class registration list**, not a second
hand-written renderer per node — that part of the "custom widget" story
already works acceptably today. Any future widget node (Wokwi/SiliWiz
iframe, WaveDrom diagram, 7-segment decoder) follows the exact same
`DecoratorNode` shape already proven four times over in this codebase. The
fix for the registration risk itself is a small, mechanical refactor (see
§6) independent of any editor-library decision.

---

## 3. Per-option evaluation

### Option 1 — Stay on Lexical, wire up `@lexical/markdown`

Covered in full in §2.1 and §2.4. Custom block ergonomics: proven in
production via `DecoratorNode` (4 working examples). Read-only rendering:
`LexicalContent.tsx` runs a second, full `LexicalComposer` instance with
`editable: false` — there is no "render without an editor instance" path
in Lexical; you always instantiate the editor, even to display static
content (visible in the code as an artificial 100ms `setTimeout` used
purely to gate a loading skeleton while the composer initializes). This is
a real weakness relative to TipTap's static renderer or Plate's
`<PlateStatic>`, but it's a pre-existing, already-absorbed cost, not a new
one.

- **React 19**: Empirically proven — this exact stack (`react@^19.1.1`,
  `@lexical/react@^0.37.0`) is running in production today. Registry peer
  dependency for `@lexical/react` is `react: '>=18.x'` — permissive enough
  to include 19 ([registry.npmjs.org/@lexical/react](https://registry.npmjs.org/@lexical/react)).
- **MUI**: Native — the editor chrome (`ToolbarPlugin.tsx`, dialogs) is
  hand-built MUI already; no friction.
- **Bundle**: `lexical` core alone is 53.8 KB gzip / 170 KB raw
  ([bundlephobia](https://bundlephobia.com/package/lexical@0.49.0)).
  `@lexical/react` has no single bundlephobia figure — its package.json
  only exposes per-feature subpaths (`LexicalComposer`, `RichTextPlugin`,
  etc.), no root export, confirmed by a bundlephobia build error
  ("Package subpath '.' is not defined by exports"). The realistic total
  is the sum of the specific subpaths already imported, which isn't
  independently measurable via bundlephobia's single-package API.
- **Markdown**: See §2.1 — installed, unused, non-trivial but bounded work
  to wire (2–4 days incl. custom transformers for 5 node types).
- **Maintenance health**: `facebook/lexical` — 23,813 stars, 312 open
  issues, last pushed 2026-08-30, not archived
  ([api.github.com/repos/facebook/lexical](https://api.github.com/repos/facebook/lexical)).
  `lexical` npm latest is **0.49.0**, published 2026-07-30
  ([registry.npmjs.org/lexical](https://registry.npmjs.org/lexical)) — the
  repo is pinned to `^0.37.0`, i.e. meaningfully behind current (worth a
  separate, non-urgent upgrade pass regardless of this decision). Weekly
  downloads: `lexical` 5,109,616; `@lexical/react` 4,763,287
  ([api.npmjs.org/downloads](https://api.npmjs.org/downloads/point/last-week/lexical)).
  Meta-backed.
- **Migration cost**: zero — this is the do-nothing-structural baseline.

### Option 2 — TipTap 3 / ProseMirror

- **Custom block ergonomics**: `ReactNodeViewRenderer` wraps a React
  component as a ProseMirror NodeView
  ([tiptap.dev — React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)),
  a well-trodden pattern (this is what BlockNote itself is built on top
  of). For read-only rendering, TipTap 3 ships a first-party
  `@tiptap/static-renderer` package (npm: created 2024-12-04, latest
  3.30.5 published 2026-08-26, i.e. released in lockstep with core —
  [registry.npmjs.org/@tiptap/static-renderer](https://registry.npmjs.org/@tiptap/static-renderer)).
  Its `renderToReactElement()` converts ProseMirror JSON directly to a
  React element tree **without instantiating an Editor**, using an
  explicit `nodeMapping` object to map custom node types to React
  components ([tiptap.dev — Static Renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer)).
  This is a genuinely better-supported version of what
  `LexicalContent.tsx` does today by brute force (spin up a full
  composer). Caveat from the same docs: because no Editor instance runs,
  extensions relying on runtime transaction hooks (e.g. auto-generated
  unique IDs, table-of-contents extraction) don't populate automatically
  and need pre-processing.
- **React 19**: Explicit — `@tiptap/react@3.30.5` peer dependency is
  `"react": "^17.0.0 || ^18.0.0 || ^19.0.0"`
  ([registry.npmjs.org/@tiptap/react](https://registry.npmjs.org/@tiptap/react)).
- **MUI**: TipTap ships no default toolbar UI at all — you build your own
  chrome around the `Editor` instance, so it's fully MUI-compatible by
  construction (same posture as today's Lexical `ToolbarPlugin.tsx`).
- **Bundle**: `@tiptap/starter-kit` (a comparable "headings, lists, code,
  links, marks" baseline, includes `prosemirror-view` etc.) is 105.3 KB
  gzip / 337 KB raw
  ([bundlephobia](https://bundlephobia.com/package/@tiptap/starter-kit@3.30.5)).
  `@tiptap/react` itself is a thin 7.8 KB gzip layer on top
  ([bundlephobia](https://bundlephobia.com/package/@tiptap/react@3.30.5)).
- **Markdown**: TipTap now has a first-party `@tiptap/markdown` package
  (npm: created 2025-10-14, latest 3.30.5 published 2026-08-26 — released
  alongside core, [registry.npmjs.org/@tiptap/markdown](https://registry.npmjs.org/@tiptap/markdown)),
  using MarkedJS for CommonMark-compliant parsing, with bidirectional
  parse/serialize. Official docs explicitly label it "early release, can
  be subject to change or may have edge cases that may not be supported
  yet" ([tiptap.dev/docs/editor/markdown](https://tiptap.dev/docs/editor/markdown)).
  Custom-node round-tripping isn't documented beyond "each extension
  defines its own parsing/rendering logic" — i.e., same amount of
  per-node hand-wiring as Lexical's transformers, just a newer,
  less-battle-tested implementation. There's also a legacy community
  package, `tiptap-markdown` (unaffiliated with the tiptap org, latest
  0.9.0, published 2025-09-08 — [registry.npmjs.org/tiptap-markdown](https://registry.npmjs.org/tiptap-markdown)),
  now superseded by the official one.
- **Maintenance health**: `ueberdosis/tiptap` — 38,197 stars, 840 open
  issues, last pushed 2026-08-28, not archived
  ([api.github.com/repos/ueberdosis/tiptap](https://api.github.com/repos/ueberdosis/tiptap)).
  Weekly downloads for `@tiptap/react`: 14,924,978
  ([api.npmjs.org](https://api.npmjs.org/downloads/point/last-week/@tiptap/react)) —
  the highest of any option evaluated. Commercially backed by ueberdosis
  (which also sells Tiptap Pro/Cloud add-ons).
- **Migration cost**: full editor rewrite. See §6 sketch for what a switch
  would entail if ever chosen later.

### Option 3 — Plate (`platejs`, formerly `@udecode/plate`)

Note: the package ecosystem rebranded from `@udecode/plate-*` to
`@platejs/*` (bare package `platejs`) in 2025; `@udecode/plate` is
explicitly marked no-longer-supported in favor of `platejs`
([platejs.org/docs/migration](https://platejs.org/docs/migration), plus
npm listing corroboration). Evaluating the current `platejs` namespace,
not the legacy one, to avoid understating its health.

- **Custom block ergonomics**: Plugin system built on Slate, with
  component association via `Plugin.withComponent(Component)`. The
  standout feature for this evaluation: Plate ships a first-class
  `<PlateStatic>` component, explicitly documented as "a fast, read-only
  React component for rendering Plate content, optimized for server-side
  or React Server Component (RSC) environments," which "avoids
  client-side editing logic" instead of running the interactive editor in
  read-only mode ([platejs.org/docs/static](https://platejs.org/docs/static)).
  The catch: custom/client-only node components need a **parallel,
  server-safe static equivalent** written and mapped explicitly per plugin
  — i.e., Plate makes you do intentionally, and with official tooling,
  something structurally similar to what OpenSilício's dual
  `LexicalEditor.tsx`/`LexicalContent.tsx` does today by accident. It
  trades "no compiler safety net" for "an explicit, documented, and
  lighter-weight second rendering path."
- **React 19**: `platejs`/`@platejs/core` peer dependency is
  `"react": ">=18.0.0"`, `"react-dom": ">=18.0.0"` — no upper bound, so 19
  is covered but not pinned/tested explicitly
  ([registry.npmjs.org/platejs](https://registry.npmjs.org/platejs)).
- **MUI**: The documented, supported installation path is shadcn/ui +
  Tailwind (`npx shadcn@latest add @plate/editor-basic`) — the official
  quickstart's prerequisite is explicitly "shadcn/ui and Plate UI"
  ([platejs.org/docs/installation/next](https://platejs.org/docs/installation/next)).
  The core plugin engine is UI-agnostic in principle (components are
  swappable via `withComponent()`), but there is no documented MUI
  integration path — adopting Plate would mean hand-building the entire
  toolbar/dialog/menu chrome from scratch rather than reusing anything
  from the shadcn/Tailwind ecosystem the docs assume, which is a much
  bigger lift than TipTap or BlockNote's "bring your own UI" posture
  (those ship *no* opinionated UI at all to route around; Plate's docs
  actively steer toward one you'd have to route around).
- **Bundle**: `platejs` core package alone (framework + Slate, no UI
  plugins) is 97.0 KB gzip / 325 KB raw
  ([bundlephobia](https://bundlephobia.com/package/platejs@53.3.9)) — a
  full editor with heading/list/link/etc. plugins plus a hand-built UI
  layer would be meaningfully larger than this baseline.
- **Markdown**: First-party `@platejs/markdown` plugin, latest 53.3.3,
  published 2026-08-04 ([registry.npmjs.org/@platejs/markdown](https://registry.npmjs.org/@platejs/markdown)) —
  actively maintained alongside the core rebrand.
- **Maintenance health**: `udecode/plate` — 16,542 stars, only **14** open
  issues (unusually low — either very well-triaged or a smaller active
  user base filing fewer issues), last pushed 2026-08-30
  ([api.github.com/repos/udecode/plate](https://api.github.com/repos/udecode/plate)).
  Weekly downloads: `platejs` 504,999; legacy `@udecode/plate` 120,818,
  confirming the userbase has substantially moved to the new namespace
  ([api.npmjs.org](https://api.npmjs.org/downloads/point/last-week/platejs)).
- **Migration cost**: full rewrite, plus a from-scratch MUI toolbar/dialog
  layer (no reusable UI to adopt), plus a duplicate static-component
  layer per custom node going forward.

### Option 4 — BlockNote

- **Custom block ergonomics**: `createReactBlockSpec(blockConfig,
  blockImplementation, extensions?)` is the documented API — a React
  component with a `render()` method receiving `block`/`editor`/
  `contentRef`, plus optional `toExternalHTML()`/`parse()`/
  `parseContent()` hooks
  ([blocknotejs.org — Custom Blocks](https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks)).
  Docs explicitly demonstrate mixing in a different UI kit (Mantine) inside
  a custom block, framing BlockNote as UI-kit-agnostic at the custom-block
  level. For read-only rendering, BlockNote's real "no editor instance"
  story lives in `@blocknote/server-util`'s `ServerBlockNoteEditor` class
  and its `blocksToFullHTML()` method, with custom blocks needing a
  `toExternalHTML` component for correct static HTML output. This is a
  **Node-side** utility (npm: `@blocknote/server-util`, latest 0.54.0,
  published 2026-08-13 — [registry.npmjs.org/@blocknote/server-util](https://registry.npmjs.org/@blocknote/server-util)),
  meaning it's designed for a server-rendering step, not for direct use
  inside a client-only Vite SPA like `openSilicioWebsite/`. Using it here
  would mean adding a backend render step (or a build-time prerender),
  not a drop-in replacement for `LexicalContent.tsx`'s client-side render.
  Absent that, client-side read-only display would fall back to running
  the interactive editor with `editable={false}` — the same pattern
  Lexical already uses today, with no net improvement.
- **React 19**: Explicit — `@blocknote/react@0.54.0` peer dependency is
  `"react": "^18.0 || ^19.0 || >= 19.0.0-rc"`
  ([registry.npmjs.org/@blocknote/react](https://registry.npmjs.org/@blocknote/react)).
- **MUI**: BlockNote ships **three** official UI-binding packages —
  `@blocknote/mantine` (default), `@blocknote/ariakit` (headless/unstyled),
  `@blocknote/shadcn` — all at 0.54.0, confirmed present on the npm
  registry. There is no `@blocknote/mui`. `@blocknote/ariakit` (headless)
  would be the realistic starting point for building MUI-consistent
  toolbar chrome, but that's still real UI-authoring work, not reuse.
  Note also that `@blocknote/core`'s own `peerDependencies` list a full
  Yjs collaboration stack (`yjs`, `y-prosemirror`, `y-protocols`,
  `@y/prosemirror`, `@y/protocols`, `@y/y`)
  ([registry.npmjs.org/@blocknote/core](https://registry.npmjs.org/@blocknote/core))
  — required peers even though this project has no collaborative editing
  need, a heavier dependency footprint than the other options carry for
  equivalent functionality.
- **Bundle**: `@blocknote/core` alone: 178.9 KB gzip / 597 KB raw
  ([bundlephobia](https://bundlephobia.com/package/@blocknote/core@0.54.0)).
  `@blocknote/react` (core + Mantine UI + emoji picker data) totals
  roughly 236.7 KB gzip main bundle plus 82.8 KB and 27.4 KB async chunks
  (~347 KB gzip combined) — the largest footprint of any option measured
  here ([bundlephobia](https://bundlephobia.com/package/@blocknote/react@0.54.0)).
- **Markdown**: BlockNote has built-in markdown import/export
  (`blocksToMarkdownLossy`/`tryParseMarkdownToBlocks` per its own docs
  ecosystem), but it's explicitly "lossy" by BlockNote's own naming
  convention for non-standard block types — consistent with every other
  option here needing custom work for the 5 project-specific node types.
- **Maintenance health**: `TypeCellOS/BlockNote` — 10,134 stars, 191 open
  issues, last pushed 2026-08-28, not archived
  ([api.github.com/repos/TypeCellOS/BlockNote](https://api.github.com/repos/TypeCellOS/BlockNote)).
  Weekly downloads for `@blocknote/react`: 545,662
  ([api.npmjs.org](https://api.npmjs.org/downloads/point/last-week/@blocknote/react)).
  This is the exact library the project already tried and abandoned once
  in October 2025 (§2.2/§2.3) — re-adopting it now would be re-litigating
  a decision this project already made and reversed within days, with the
  same custom-block friction (LaTeX/YouTube blocks added then immediately
  ripped out) that plausibly caused the original abandonment, still
  present in the current version.
- **Migration cost**: full rewrite; the project has direct, recent,
  negative first-hand experience with this exact library.

### Option 5 — Milkdown

- **Custom block ergonomics**: Milkdown is markdown-native and
  ProseMirror-based, "headless and comes without any CSS"
  ([milkdown.dev](https://milkdown.dev/)) — a genuinely good starting
  point for MUI reuse since there's no competing design system to route
  around, unlike Plate's shadcn-first posture. Building a custom node
  with an embedded React component requires the companion
  `@prosemirror-adapter/react` package's `useNodeViewFactory` hook (per
  official examples referenced from milkdown.dev's React recipes page and
  corroborating GitHub discussion/example repos) — this is an additional
  dependency and API surface beyond Milkdown's own core docs, which
  primarily describe the plugin system in the abstract rather than a
  concrete "add a React widget" walkthrough (fetching
  `milkdown.dev/docs/guide/node` and `.../react-nodes` directly returned
  only the marketing homepage content, not the technical guide body — the
  detail here is sourced from search-result excerpts of
  `milkdown.dev/docs/recipes/react`, not a direct primary-source read, and
  should be treated as less certain than the other findings in this
  document). I could not confirm from official documentation whether
  Milkdown has a dedicated static/read-only renderer independent of a
  running editor instance. However, because Milkdown's canonical storage
  format is markdown text (not a JSON tree), a read-only view could in
  principle bypass Milkdown/ProseMirror entirely and reuse a standalone
  markdown renderer like `react-markdown` — provided custom widget nodes
  round-trip cleanly to/from markdown syntax, which is not verified here
  and would need to be designed per node type.
- **React 19**: `@milkdown/react@7.22.1` peer dependency is `"react": "*"`,
  `"react-dom": "*"` — unconstrained, so 19 is trivially satisfied, though
  an unconstrained range is a weaker compatibility signal than an
  explicit tested range like TipTap's or BlockNote's
  ([registry.npmjs.org/@milkdown/react](https://registry.npmjs.org/@milkdown/react)).
- **MUI**: No conflict — headless by design, confirmed above.
- **Bundle**: `@milkdown/core` is 93.5 KB gzip / 315 KB raw, and already
  bundles `prosemirror-view` plus remark/micromark markdown-parsing
  machinery since markdown is Milkdown's native format
  ([bundlephobia](https://bundlephobia.com/package/@milkdown/core@7.22.1)).
  `@milkdown/react` itself is a negligible 0.6 KB gzip
  ([bundlephobia](https://bundlephobia.com/package/@milkdown/react@7.22.1)).
  A real editor would also need a preset (e.g. commonmark) and a
  node-view adapter, pushing the total somewhat higher, but this is
  structurally the lightest ProseMirror-based option because it doesn't
  carry a separate JSON schema layer on top of markdown.
- **Markdown**: Native by construction — the editor's internal
  representation round-trips to markdown by default, since that's the
  library's whole premise (`Milkdown/milkdown` — "Plugin driven WYSIWYG
  Markdown editor framework").
- **Maintenance health**: `Milkdown/milkdown` — 11,866 stars, 30 open
  issues (small and apparently well-triaged), last pushed 2026-08-30, not
  archived ([api.github.com/repos/Milkdown/milkdown](https://api.github.com/repos/Milkdown/milkdown)).
  Weekly downloads for `@milkdown/react`: 163,555
  ([api.npmjs.org](https://api.npmjs.org/downloads/point/last-week/@milkdown/react)) —
  the smallest userbase of any library option evaluated, community-run
  rather than company-backed.
- **Migration cost**: full rewrite, with the added uncertainty that the
  custom-node-authoring story (the deciding criterion for this whole
  evaluation) is the least clearly documented of any option here.

### Option 6 — Plain markdown source + preview pane

Drop WYSIWYG rich-text editing; author in a markdown textarea/CodeMirror
pane with a live preview, custom widgets expressed via directive syntax
(e.g. `::wokwi{id="..."}`) parsed by remark/rehype plugins into React
components.

- **Custom block ergonomics**: This is the only option where the
  read-only render path has **no editor concept at all** — the stored
  format (markdown text) is fed directly into `react-markdown`, and custom
  widgets are handled via a `remark-directive`-style plugin that turns
  `::wokwi{...}` into a custom AST node, mapped to a React component via
  `react-markdown`'s `components` prop. There is no dual-registration risk
  by construction, because there's only one consumer of the content
  format (the renderer), not two (an editor's internal model and a
  read-only render of that model). The trade-off is on the *authoring*
  side: there is no rich WYSIWYG canvas — content authors type directive
  syntax by hand (optionally eased by toolbar buttons that insert
  snippets into the CodeMirror pane), which is a workflow change from
  today's click-driven Lexical toolbar.
- **React 19**: `react-markdown@10.1.0` peer dependency is `"react":
  ">=18"` ([registry.npmjs.org/react-markdown](https://registry.npmjs.org/react-markdown)).
  `@uiw/react-codemirror`'s own peer dependencies list `react`/`react-dom`
  without a version ceiling in its registry listing
  ([registry.npmjs.org/@uiw/react-codemirror](https://registry.npmjs.org/@uiw/react-codemirror)
  peerDependencies field, retrieved via bundlephobia's dependency data).
- **MUI**: No conflict — a `<textarea>`/CodeMirror pane plus a plain
  rendered-markdown `<div>` are just DOM content inside whatever MUI
  layout wraps them; there's no competing widget library.
- **Bundle**: `react-markdown` is 34.1 KB gzip / 114 KB raw — by a wide
  margin the smallest read-side rendering cost of any option evaluated
  ([bundlephobia](https://bundlephobia.com/package/react-markdown@10.1.0)).
  The editing surface is heavier than it might look: `@uiw/react-codemirror`
  is 48.8 KB gzip, and `@codemirror/lang-markdown` (markdown syntax
  highlighting/language support) is 174.7 KB gzip on its own
  ([bundlephobia](https://bundlephobia.com/package/@codemirror/lang-markdown@6.5.2)) —
  so the *editing* side is not dramatically lighter than a rich-text
  editor's total footprint; the win is concentrated entirely in the
  *public-facing read path*, which is also the higher-traffic side of
  this application (many readers per author).
- **Markdown import/export quality**: Perfect by construction — the
  stored format never leaves markdown, so there's no round-trip to lose
  fidelity on. `remark-directive` (latest 4.0.0, published 2025-02-27 —
  [registry.npmjs.org/remark-directive](https://registry.npmjs.org/remark-directive))
  is the standard, actively-maintained mechanism (part of the unifiedjs/
  remark ecosystem) for exactly this "custom directive → custom component"
  pattern.
- **Maintenance health**: `react-markdown`'s own last npm publish was
  2025-03-07 ([registry.npmjs.org/react-markdown](https://registry.npmjs.org/react-markdown)) —
  over a year with no release as of this writing. That reads as mature
  and stable rather than abandoned (it's a foundational package in the
  unifiedjs ecosystem with an enormous install base and no open
  architectural churn), but it is worth flagging honestly since every
  other option in this document has shipped a release within the last
  month. `remark-gfm` (GitHub-flavored markdown extensions — tables,
  strikethrough, etc.), latest 4.0.1, published 2025-02-10
  ([registry.npmjs.org/remark-gfm](https://registry.npmjs.org/remark-gfm)),
  same pattern.
- **Migration cost**: full rewrite of the editing surface (replace
  `LexicalEditor.tsx`'s WYSIWYG canvas with a CodeMirror pane), but a
  near-total *simplification* of the render side (`LexicalContent.tsx`
  shrinks from a full second editor instantiation to a `react-markdown`
  call). This is the only option that would also let `conteudo/`'s
  existing `.md`-first authoring pipeline be adopted as the *primary*
  authoring path rather than worked around.

---

## 4. Comparison table

| | Lexical (stay) | TipTap 3 | Plate (`platejs`) | BlockNote | Milkdown | Markdown + preview |
|---|---|---|---|---|---|---|
| Custom React block API | `DecoratorNode` (class-based, proven 4×) | `ReactNodeViewRenderer` (proven pattern, used by BlockNote itself) | `withComponent()` on Slate plugins | `createReactBlockSpec` | `useNodeViewFactory` (via `@prosemirror-adapter/react`) | remark directive → component map |
| Read-only w/o editor instance | No — always instantiates a composer | Yes — `@tiptap/static-renderer` (first-party) | Yes — `<PlateStatic>` (first-party, needs parallel static components) | Only via Node-side `@blocknote/server-util` (not client-SPA-usable as-is) | Unclear from docs; markdown-native format makes a bypass *possible* but unverified | Yes, trivially — no editor concept on the read side at all |
| React 19 peer dep | `>=18.x` (permissive) | `^17\|\|^18\|\|^19` (explicit) | `>=18.0.0` (permissive) | `^18.0\|\|^19.0\|\|>=19.0.0-rc` (explicit) | `*` (unconstrained) | `>=18` (react-markdown) |
| MUI fit | Native (already built) | No opinionated UI — build your own (native fit) | Docs assume shadcn/Tailwind; no MUI path | 3 official UI kits (Mantine/ariakit/shadcn), no MUI | Headless, no CSS — native fit | No opinionated UI — native fit |
| Bundle (comparable baseline, gzip) | 53.8 KB core only (`@lexical/react` unmeasurable as single figure) | 105.3 KB (starter-kit) | 97.0 KB (core only, no UI) | 178.9 KB core / ~347 KB w/ React UI | 93.5 KB core | 34.1 KB read side / ~220 KB+ full CodeMirror edit side |
| Markdown | Installed, unused (§2.1) | First-party, "early release" | First-party (`@platejs/markdown`) | Built-in, self-described "lossy" for custom blocks | Native (it *is* the format) | Native (it *is* the format) |
| GitHub stars / open issues | 23,813 / 312 | 38,197 / 840 | 16,542 / 14 | 10,134 / 191 | 11,866 / 30 | n/a (ecosystem of small packages) |
| Weekly npm downloads (primary pkg) | 5.1M (`lexical`) | 14.9M (`@tiptap/react`) | 505K (`platejs`) | 546K (`@blocknote/react`) | 164K (`@milkdown/react`) | n/a |
| Backing | Meta | Commercial (ueberdosis) | Community (small, low-issue-count) | Commercial (TypeCell) | Community | unifiedjs ecosystem (community) |
| Prior history in this repo | Current, working, proven | Used once, abandoned (§2.2) | n/a | Used once, abandoned (§2.2/2.3) | n/a | n/a |
| Migration cost today | None | Full rewrite | Full rewrite + build own UI | Full rewrite (repeat of already-failed attempt) | Full rewrite, riskiest unknowns | Full rewrite of edit side, simplifies read side |

---

## 5. Final recommendation

Weighing everything against the stated deciding criterion — custom
interactive block node ergonomics for editing *and* read-only rendering —
none of the alternative libraries clear a high enough bar over Lexical to
justify the migration cost, for three reasons specific to this project:

1. **The forward requirement is already solved, in production, four
   times over.** `EquationNode`/`YouTubeNode`/`ImageNode`/
   `ImageGalleryNode` are all `DecoratorNode` subclasses whose `decorate()`
   method renders arbitrary React and is shared between the editing and
   read-only paths. A `WokwiNode`, `SiliWizNode`, `WaveDromNode`, or
   `SevenSegmentDecoderNode` is the same shape of work as `EquationNode.tsx`
   (113 lines) — this is not a theoretical claim about Lexical's
   architecture, it's an observed fact about this specific codebase.
2. **Both concrete, current pain points are fixable without a library
   swap.** The markdown-paste gap (§2.1) is a plugin-and-transformers
   job, not a rewrite. The dual-registration risk (§2.4) is a one-file
   refactor (export one `nodes` array, import it in both places) that
   removes the compiler-safety gap entirely, and is worth doing on its
   own merits regardless of any other decision in this document.
3. **This project has already paid the cost of editor churn once, and it
   was expensive.** TipTap → BlockNote → Lexical inside 11 days (§2.2),
   including a full-table `TRUNCATE` of real content (§2.3) and a
   custom-block feature (LaTeX/YouTube in BlockNote) that was built and
   then discarded within 24 hours. Migrating again — this time with real
   content in a wiki/blog/education library that's actively growing —
   reopens exactly that risk for a set of benefits (a nicer read-only
   static renderer in TipTap/Plate; a lighter read-side bundle with plain
   markdown) that are real but secondary to the stated priority.

If a future need genuinely outgrows Lexical's `DecoratorNode` model — for
instance, if the "read-only render without an editor instance" gap in
§2.4 starts causing real problems (perf, SSR, or a headless-rendering
requirement that doesn't exist today) — **TipTap 3** is the option worth
revisiting first, specifically because of `@tiptap/static-renderer`'s
`renderToReactElement()` + `nodeMapping` API, which is the most direct,
first-party answer to exactly the architectural gap `LexicalContent.tsx`
papers over today. It is also the most heavily used and fastest-moving
library evaluated. That is a note for the future, not a recommendation to
act on now.

---

## 6. Migration sketch for the recommended path (stay on Lexical)

This is a plan outline, not implementation code.

### 6.1 Markdown import/export

1. Add `MarkdownShortcutPlugin` (from
   `@lexical/react/LexicalMarkdownShortcutPlugin`) to `LexicalEditor.tsx`'s
   plugin list, passing the default `TRANSFORMERS` from
   `@lexical/markdown` plus whatever custom transformers are added in
   step 3. This alone restores live `##`/`**bold**`/`- list` typing
   shortcuts for the already-registered standard nodes.
2. Add a small new plugin (same shape as `WikiLinkPlugin.tsx`) that
   intercepts `PASTE_COMMAND`: if the clipboard's plain-text payload looks
   like markdown and no HTML payload is present (or the HTML payload is
   trivial), call `$convertFromMarkdownString(text, transformers)` instead
   of falling through to Lexical's default HTML-paste handling. This is
   the piece that actually fixes "paste a `.md` file and get formatted
   content" for the `conteudo/` workflow.
3. Write custom `Transformer` objects (element or text-match, per
   `@lexical/markdown`'s type shapes) for the 5 custom nodes, at minimum:
   an image transformer for `ImageNode` (standard `![]()` syntax isn't
   covered by the default `TRANSFORMERS`), and transformers for
   `EquationNode`/`WikiLinkNode`/`YouTubeNode` using whatever delimiter
   syntax makes sense (e.g. a fenced block or inline directive). Follow
   the existing `EquationPlugin.tsx`/`WikiLinkPlugin.tsx` files as the
   template for how this repo already wires custom nodes into editor
   commands.
4. Optionally wire `$convertToMarkdownString` behind an admin "export as
   markdown" action, and update `conteudo/README.md`'s workflow once
   paste-from-markdown actually works, so the `.md` → `build.js` → `.html`
   → paste dance can be retired for future content.

### 6.2 Dual-registration fix (independent of the above, do regardless)

1. Create one module (e.g. `src/components/lexical/nodeSet.ts`) exporting
   a single `LEXICAL_NODES` array with the current 12 node classes.
2. Import it in both `LexicalEditor.tsx`'s and `LexicalContent.tsx`'s
   `initialConfig.nodes`, deleting the two duplicated literal arrays.
3. Any future custom node (Wokwi, SiliWiz, WaveDrom, 7-segment decoder)
   only needs to be added to this one array to be registered everywhere
   it needs to be — closing the silent-failure risk described in §2.4.

### 6.3 Adding the new interactive widget nodes

For each of Wokwi/SiliWiz (iframe embeds), WaveDrom (JSON → diagram), and
custom small widgets (7-segment decoder):

1. New `DecoratorNode` subclass in `src/components/lexical/nodes/`,
   following `EquationNode.tsx`'s shape: `getType`/`clone`/constructor/
   `importJSON`/`exportJSON`/`createDOM`/`updateDOM`/`decorate()`, where
   `decorate()` renders the actual React widget (an `<iframe>` for
   Wokwi/SiliWiz, a WaveDrom-rendering component fed the stored JSON
   config, or the 7-segment decoder component fed its stored props).
2. New plugin (following `EquationPlugin.tsx`/`YouTubePlugin.tsx`) to
   register an insertion command and, where relevant, a toolbar button in
   `ToolbarPlugin.tsx`.
3. Add the new node class to the shared `LEXICAL_NODES` array from §6.2 —
   done once, works everywhere.
4. If markdown round-tripping matters for these specific widgets, add a
   transformer per §6.1 step 3 (e.g. a directive syntax like
   `:::wokwi{id=...}:::`); if not, they simply won't survive a markdown
   paste/export round-trip, same as images do not today without step 6.1.3.

### 6.4 Content migration

Not applicable in the traditional sense — none of the above changes the
Lexical JSON storage format, so the 3 existing `education_resources` rows
(the only real content in production today, per already-verified
production data) need no conversion at all. This is the only one of the
seven paths evaluated in this document where "migration cost" is exactly
zero.

---

## Sources consulted

Primary sources cited inline throughout: npm registry
(`registry.npmjs.org`), npm downloads API (`api.npmjs.org`), GitHub REST
API (`api.github.com`), bundlephobia (`bundlephobia.com`), and official
docs (`tiptap.dev`, `platejs.org`, `blocknotejs.org`, `milkdown.dev`),
plus this repository's own git history (`git log`, `git show`) and source
files, read directly rather than summarized secondhand. All version
numbers, dates, star/issue counts, download counts, and bundle sizes in
this document were retrieved live from the above APIs on 2026-08-30 and
are not estimates. Where a claim could not be verified from a primary
source (Milkdown's exact custom-node authoring guide content, and
`@uiw/react-codemirror`'s precise React-19-tested range), this is called
out explicitly in the relevant section rather than presented as fact.
