# OpenSilício Redesign — Implementation Plan

> Source of truth for turning the "Industry" mockups into the live site. Self-contained: written so any model/agent can implement from this file alone, without re-fetching the Claude Design project.

**Origin:** `claude.ai/design/p/26d9bd00-f4b7-4a15-9c12-505405b153a9` ("OpenSilício content inventory" project), file `OpenSilicio Redesign.dc.html`, six mockup screens over the **Industry** design system.
**Related reading already in this repo:** `UI_Specification.md` (current-state IA/gap inventory this redesign responds to).

---

## 1. What the mockup actually specifies (and what it doesn't)

The `.dc.html` file is a **design canvas**, not a page to port verbatim. Two things in it are canvas-only chrome, not site content:

1. **The cover block** at the top of the file (kicker "Turno 01 · Redesign OpenSilício", H1 "Seis telas, uma prancheta", intro paragraph) — a title slide for the export. Discard entirely.
2. **The first `<div>` inside every numbered artboard** (`id="1a"`, `1b`, `1c`, `1d`, `1e`, `1f`, `1g`) — a grey label bar reading e.g. `"1a · Landing — desktop, conteúdo completo"` / `"/"` / `"1280 × auto"`. This is the canvas's own annotation (screen name / route / dimensions). **Never render this on the live site.** The real page always starts at the `<nav class="nav">` immediately after it.

Six artboards map to real pages/states like this:

| Artboard | Real route | What it shows |
|---|---|---|
| 1a | `/` | Full Landing page, all sections |
| 1b | *(not a page)* | Header/nav component states: light, dark ("steel field"), mobile drawer closed/open — **plus a "decisions this round" callout, itself documentation, not UI** |
| 1c | `/educacao` | Education listing: tabs w/ counts, level filter, cards, pagination |
| 1d | `/educacao/:id` | Education resource detail, **Projetos-category variant** (tabbed) |
| 1e | `/blog/:slug` | Blog post detail |
| 1f + 1g | `/wiki` | Same page, two states: populated (1f) and the **real current empty state** (1g) |

Pages **not** covered by a mockup — restyle using the tokens/components below, no bespoke reference: Blog listing (`/blog`), Wiki entry detail (`/wiki/:slug`), About (`/sobre`), Login (`/login`), all `/admin/*` pages. Judgment calls there should follow the design system's own rules (§2), not invent new patterns.

The 1b callout also states two things that are **aspirational, not designed**: "Eventos e Projetos entram na navegação como páginas reais" — every actual link for those two nav items in the mockup still points back to `#1a`/`#1c`. No Eventos content type, schema, or page layout exists anywhere in the six screens. Treat as out of scope for this pass — see §7 decision D1.

---

## 2. Design system: "Industry", branded for OpenSilício

Two versions of this system exist in the Design project. **Use the OpenSilício-branded one** (`tokens/*.css` + `patterns/*.css` at the project root) — it's the polished, intentional deliverable (has `.photo-slot`, `--color-steel-*` naming, brand/logo guidance). The generic `_ds/industry-…/styles.css` the mockup literally links is a starter kit the branded system was derived from; values are identical where they overlap (e.g. `#1d2d3d` is both `--color-accent-900` there and `--color-steel-900`/`--color-field` here).

### 2.1 Integration strategy for this codebase

The current stack is React 19 + MUI 7 (`openSilicioWebsite/`), themed via `src/theme.ts` (`getTheme(mode)`). Recommended approach — **don't fight MUI, re-skin it**:

1. Copy the 8 real CSS files verbatim into `openSilicioWebsite/src/styles/design-system/`:
   `tokens/{fonts,colors,typography,spacing,shape}.css`, `patterns/{base,blueprint,ui}.css`, plus an entry `styles.css` that just `@import`s them (mirror the source project's own structure — see §2.2 for exact content). Import that entry file once, globally, in `main.tsx`.
2. Rewrite `src/theme.ts`'s `getTheme(mode)` to mirror the **same values** (palette, typography, `shape.borderRadius: 0`) so MUI's own primitives (`Tabs`, `Chip`, `TextField`, `Drawer`) theme correctly instead of clashing with the new look.
3. Keep MUI components for structure, state and accessibility (`Drawer` for the mobile nav, `Tabs` for the Recurso/wiki tab logic, `Select`/`TextField` in admin forms) — but style them to match via `sx` referencing the CSS custom properties (`var(--color-steel-700)` etc. work fine inside MUI's `sx`).
4. Build a small set of new shared presentational components (none of these exist today) since the blueprint frame is repeated on nearly every card/figure in the mockups:

| New component | File | Purpose |
|---|---|---|
| `BlueprintFrame` | `src/components/design/BlueprintFrame.tsx` | Wraps children in `<div class="blueprint">` + the 4 `<i class="corner …">` marks. Takes `children`, optional `sx`. |
| `DuotonePhoto` | `src/components/design/DuotonePhoto.tsx` | `<img>` wrapped in `.duotone`; if `src` is falsy, renders `.photo-slot` with the given label text instead (**never fakes a photo** — this is a system rule, not a nice-to-have). |
| `TitleBlockBar` | `src/components/design/TitleBlockBar.tsx` | The "sheet header" bar (`.title-block`) used atop drawn panels, e.g. "Acesso rápido — por onde começar / Folha 01". |
| `BlankSheet` | `src/components/design/BlankSheet.tsx` | The hatched, blueprint-framed "nothing here yet" panel: headline, one-sentence reason, up to 2 CTA buttons, optional list of tag chips. Used by empty Wiki, pending wiki-term page, and 404 (§6.5). |

### 2.2 Exact token values (copy these files as-is)

**`tokens/colors.css`**
```css
:root {
  --brand-steel: #5980a6;
  --brand-paper: #f2f2f3;
  --brand-ink: #1d1f20;

  --color-steel-100: #eef6ff; --color-steel-200: #d6ebff; --color-steel-300: #b5d9fd;
  --color-steel-400: #94bce3; --color-steel-500: #5980a6; --color-steel-600: #4a6e91;
  --color-steel-700: #416180; --color-steel-800: #2c455d; --color-steel-900: #1d2d3d;

  --color-neutral-100: #f5f5f8; --color-neutral-200: #e7e7ea; --color-neutral-300: #d4d4d7;
  --color-neutral-400: #b7b7ba; --color-neutral-500: #98989b; --color-neutral-600: #7a7a7d;
  --color-neutral-700: #5d5d60; --color-neutral-800: #424244; --color-neutral-900: #1d1f20;

  --color-bg: var(--brand-paper);
  --color-bg-alt: var(--color-neutral-100);
  --color-field: var(--color-steel-900);
  --color-field-deep: #16222e;
  --color-text: var(--color-neutral-900);
  --color-text-muted: color-mix(in srgb, var(--color-neutral-900) 70%, transparent);
  --color-text-faint: color-mix(in srgb, var(--color-neutral-900) 55%, transparent);
  --color-on-field: var(--brand-paper);
  --color-on-field-muted: color-mix(in srgb, var(--brand-paper) 78%, transparent);

  --color-accent: var(--color-steel-500);
  --color-accent-ink: var(--color-steel-700);

  --color-line: color-mix(in srgb, var(--color-neutral-900) 16%, transparent);
  --color-line-strong: color-mix(in srgb, var(--color-neutral-900) 40%, transparent);
  --color-line-on-field: color-mix(in srgb, var(--brand-paper) 40%, transparent);
}
```

**`tokens/typography.css`**
```css
:root {
  --font-heading: "Barlow Condensed", "Arial Narrow", system-ui, sans-serif;
  --font-body: "Barlow", system-ui, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;
  --font-heading-weight: 600;
  --font-body-weight: 400;
  --font-body-weight-strong: 600;

  --type-display: 96px;  --type-display-lh: 100px;
  --type-title: 60px;    --type-title-lh: 62px;
  --type-h1: 44px;       --type-h1-lh: 46px;
  --type-h2: 32px;       --type-h2-lh: 36px;
  --type-h3: 24px;       --type-h3-lh: 26px;
  --type-lead: 18px;     --type-lead-lh: 30px;
  --type-body: 16px;     --type-body-lh: 24px;
  --type-small: 15px;    --type-small-lh: 24px;
  --type-kicker: 13px;   --type-kicker-lh: 12px;

  --tracking-display: 0.01em;
  --tracking-heading: 0.02em;
  --tracking-kicker: 0.08em;
  --optical-left: -0.052em; /* condensed caps at line-start hang this far left */
}
```
Load the font with: `@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@500;600;700&display=swap');` — this **replaces** the current `<link>` to Google Fonts... actually there is none today (see §6.0): the site currently references `Inter` in `theme.ts` but never loads it. This redesign retires that reference.

**`tokens/spacing.css`**
```css
:root {
  --leading: 24px; --half: 12px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px;
  --space-6: 32px; --space-7: 48px; --space-8: 56px; --space-9: 72px; --space-10: 96px;
  --edge: clamp(20px, 5vw, 56px);
  --measure: 62ch;
  --grid-gap: 32px;
}
```

**`tokens/shape.css`** — everything is square. Set `--radius: 0` (or simply hard-code `border-radius: 0` in `patterns/*`, as the source project does — there is no radius token above 0 anywhere in this system). Mirror this in `theme.ts` as `shape: { borderRadius: 0 }`.

**`patterns/blueprint.css`, `patterns/ui.css`** — copy verbatim; full content already captured during research and reproduced faithfully in the design project. **Do not re-derive these by eye from the mockup** — fetch them fresh from the Design project (`DesignSync.get_file`, `projectId: 26d9bd00-f4b7-4a15-9c12-505405b153a9`, paths `patterns/blueprint.css` and `patterns/ui.css`) since they're the actual production CSS, not a paraphrase. Key classes it defines, for reference while wiring up components: `.blueprint` + `.corner.tl/tr/bl/br`, `.duotone`, `.photo-slot`, `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-ghost`/`.btn-icon`, `.tag`/`.tag-accent`/`.tag-steel`/`.tag-neutral`/`.tag-outline`/`.tag-solid`, `.input`, `.card`/`.card-title`/`.card-body`/`.card-meta`, `.nav`/`.nav-brand` (note: `.nav-brand img { height: 28px }` — the real nav brand mark is an `<img>`, not the mockup's placeholder CSS hexagon shape), `.table`.

### 2.3 System rules that constrain every screen (from the branded project's `readme.md`)

- **One accent, no decoration beyond it.** Steel blue only. 900-step = reversed field (heroes/footers/dividers), 700-step = structural ink (kickers, rules, accent-colored body-size text — never the base 500 for running text), 500-step = the one live/interactive signal (primary button, a "new" tag).
- **Everything square.** `border-radius: 0`, no exceptions, anywhere.
- **Cards/figures/tables are line drawings.** 1px hairline border, transparent background, 4 corner registration marks (`.blueprint`). Never fill them. The primary button is the **one** solid/filled object on the page.
- **No shadows, no gradients, no blur.** `--shadow-sm/md` exist only for a real modal's overlap. The only gradient permitted anywhere is a legibility scrim behind text on a photo (Instagram templates only, not the website).
- **Photography:** always duotoned (desaturated + steel color-mix), always inside a blueprint frame. **When there is no real photo, use `.photo-slot`** (hatched rectangle, uppercase caption saying what's missing) — never a stock placeholder image, never an empty gray box.
- **Typography:** Barlow Condensed 600, uppercase, for every heading. Barlow for body. No other typeface. Optical left-hang of `-0.052em` on display-size headings.
- **Copy voice (Brazilian Portuguese, applies to any new copy written during implementation, not just existing content):** first-person plural ("Formamos…", "Levamos…"), concrete numbers over adjectives, no marketing superlatives, no emoji anywhere, numbered section kickers ("03 · O que oferecemos"), simple-verb CTAs.
- **Icons:** Lucide, stroke-width 1.5, inline SVG (`currentColor`), never filled, never emoji, never PNG.
- **Motion:** color transitions only, 120ms, no scroll-triggered entrances, no bounce/parallax.
- **Brand mark:** the group's actual logo is two-tone green (`assets/logo/logo-*.png`, original green variants). Inside this system, only the **steel-monochrome** (`logo-*-steel.png`) or **reversed-white** (`logo-*-white.png`) variants are used — green never appears next to the new palette. Pull these PNGs from the Design project (`DesignSync.get_file` on e.g. `assets/logo/logo-mark-steel.png`, base64) into `openSilicioWebsite/public/`.

---

## 3. Header / Nav (from artboard 1b)

Replace the whole `Header` function in `openSilicioWebsite/src/App.tsx`.

- **Light (default):** `.nav` on `--color-bg`, brand mark = `logo-mark-steel.png` + wordmark, links in `--color-text`, hover/current = `--color-steel-700`.
- **Dark:** the nav's background becomes `--color-field` (`--color-steel-900`) directly — **not a gradient**, and this is the *same* field color the hero and footer already use in light mode (see §4). Links go to `--color-on-field-muted`, current/hover to `--color-steel-300`. Brand mark swaps to `logo-mark-white.png`.
- **Nav items (7, unchanged order from current site plus two new — see D1 in §7 for whether to actually add them yet):** Início · Educação · Blog · Wiki · Projetos · Eventos · Sobre, plus the theme toggle icon button (`.btn-secondary.btn-icon`, sun/moon Lucide icon).
- **Mobile drawer:** keep MUI's `Drawer` (`anchor="right"`) for the slide-in mechanics already implemented — just restyle its contents to match 1b's "gaveta aberta" state: each link is a full-width row, `font-family: var(--font-heading)`, uppercase, 20px, top-bordered, current page in `--color-accent`. Closed state is just the existing `.nav` bar with a `.btn-icon` menu-toggle (hamburger, Lucide `menu` icon) replacing MUI's `MenuIcon`.

---

## 4. Landing page (artboard 1a) — `src/pages/Landing.tsx`

Full rebuild in the new visual language. Section-by-section (numbers are the mockup's own kickers, keep them):

1. **Hero.** Background is a **flat `--color-field` fill**, not the current `linear-gradient(#667eea, #764ba2)`. Content: eyebrow badge "Grupo de Pesquisa e Extensão · Poli USP" (bordered pill, `--color-on-field`), H1 "Democratizando o design de chips" (two lines, condensed uppercase, optical left-hang), existing sub-copy paragraph unchanged, two CTAs (`.btn-primary` "Começar a Aprender" → `/educacao`, ghost/outlined "Explorar Wiki" → `/wiki`). Right side: a `BlueprintFrame` + `DuotonePhoto` with no `src` yet (label: "Foto: close-up de chip"), `duotone` variant tinted for the dark field (lighter corner marks — see the mockup's `color-mix(in srgb, var(--color-bg) 70%, transparent)` corner treatment on dark grounds).
2. **Acesso rápido.** Reimagined as a single `BlueprintFrame` containing a `.table`: 4 columns (numeral 01/02/03 in `--color-accent-700`, condensed-uppercase title, description, `.btn-ghost` link). Replaces the current 3-card grid entirely — this is a real layout change, not a re-skin.
3. **Sobre.** Unchanged copy and 2-column layout; photo becomes `BlueprintFrame` + `DuotonePhoto` (no src yet: "Foto: bancada / placa"); CTA becomes `.btn-secondary`.
4. **O que oferecemos.** 6 cards (`BlueprintFrame`, transparent), same 6 topics as today **plus updated copy that explicitly folds in "teóricos"** in the Educação card's description (see exact copy in the mockup — "Guias, tutoriais, teóricos e projetos organizados do iniciante ao avançado.").
5. **Áreas de estudo (featured education).** Same `featured_education_resources` data source as today (`SiteSettings`), rendered as `BlueprintFrame` cards: `DuotonePhoto` (or `.photo-slot` "Miniatura" when no `image_url`), a `.tag-accent` reading `"{categoria} · {dificuldade}"`, title, description. **No component-level change needed to `SiteSettings`/API** — purely a card re-skin plus the thumbnail-fallback behavior from §6.4.
6. **Posts em destaque.** Same `featured_blog_posts` data source, `BlueprintFrame` cards without an image slot (mockup's blog cards are text-only: category tag, title, excerpt, byline+date).
7. **Apoiadores e parceiros.** Keep the existing single real logo; add explicit "Vaga de parceiro" dashed-border placeholder slots (3, matching the mockup) instead of just leaving empty grid space.
8. **Footer.** Same flat `--color-field` background as the hero (not its own gradient). Structure unchanged (brand+tagline / Recursos links / Sobre links / Contato) but content-wired to `SiteSettings` per the *existing* `UI_Specification.md` "should-fix" item — the mockup explicitly keeps the line "Contato e endereço vêm das Configurações" as a reminder this must stay settings-driven, not hardcoded (today it's hardcoded in `Footer.tsx` — fix this as part of the redesign, it's a pre-existing known gap, not new scope).

---

## 5. Educação (artboards 1c, 1d)

### 5.1 Listing — `src/pages/Educacao.tsx`

- **Tabs get counts.** `Todos 18 / Projetos 5 / Guias 6 / Tutoriais 4 / Teóricos 3` — compute client-side from the already-fetched `resources` array (the page already does `educationApi.getAll(true, 1, 100)` and filters client-side; **no backend/API change needed**, just `resources.filter(r => r.category === k).length` per tab, rendered as a small `opacity:.55` number next to each tab label). Active tab: `.btn`-style filled `--color-accent` chip, others plain with a left hairline divider between them (see mockup markup — it's a `<span>` row inside a single bordered container, not MUI `Tabs`; either keep MUI `Tabs` restyled to match this look, or switch to plain buttons — restyling `Tabs` is less code).
- **Level filter** (Iniciante/Intermediário/Avançado) — unchanged logic, restyle chips to `.tag-outline`, active = filled accent.
- **Cards** — `BlueprintFrame`, 16:9 image area on top: `DuotonePhoto` if `image_url` present, otherwise **the new fallback**, not the flat gray box currently shown: a diagonal-hatch pattern with the category name as a large condensed-uppercase watermark (see §6.4 — this directly fixes the "no-thumbnail cards look broken" finding from the earlier codebase audit). Below: `.tag-accent` "{categoria} · {dificuldade}", title, description, updated-date caption.
- **Pagination** — already numbered with prev/next in the current code; just restyle buttons to `.btn-secondary`/`.btn-primary` and add the "Mostrando 1–6 de 18" caption above it (`filtered.length` is already computed).

### 5.2 Resource detail — `src/pages/Recurso.tsx`

- Breadcrumb, category+difficulty tag row, H1, description — straightforward restyle, no structural change.
- **New: an optional callout box** ("Antes de começar") directly under the description, left-accent-bordered `BlueprintFrame`. **Reuse the existing `cover_letter` field** for this — it is exactly this kind of short editorial intro, already present on `EducationResource` and already rendered via `CoverLetterDisplay`; just re-skin `CoverLetterDisplay` to this callout treatment instead of its current plain-text rendering. No schema change.
- Cover image → `BlueprintFrame` + `DuotonePhoto`.
- Tabs (Visão geral / Conteúdo / Recursos) for `category === 'Projetos'` — **identical logic to today**, restyle the tab bar to the mockup's look (bottom-border segments, active tab has a top+side border and sits flush against the content, `font-family: var(--font-heading)`).
- **Aside, two new blueprint-framed boxes:**
  - **"Ficha do projeto"** — a small fact table (PDK, Ferramentas, Duração, Licença). **No such structured field exists today** (`education_resources` has only free-text `overview`/`resources`). See decision D2 in §7 — do not add schema columns for this without sign-off.
  - **"Termos usados aqui"** — wiki-term chips linking to `/wiki/:slug`. **This is fully supported today and just unused in the UI**: `GET /wiki/links/:contentType/:contentId` already exists and is public (`backend/src/routes/wiki.ts:37`, no `authMiddleware`). Add a `wikiApi.getLinksForContent(contentType, contentId)` helper in `services/api.ts` (missing today) and call it from `Recurso.tsx`/`Post.tsx` with `contentType: 'education'` / `'blog'` and the resource's id. Render each returned link as `.tag-outline` linking to `/wiki/{slug}`.
- Share & cite block — same component, same citation/BibTeX formats already implemented (`ShareAndCite.tsx`), just restyled into a `BlueprintFrame` with a `.title-block` header ("Compartilhar e citar").

---

## 6. Blog post (artboard 1e) — `src/pages/Post.tsx`

- Two-column layout: content (8fr) + sticky aside (3fr, `padding-top` offset to align below the title per the mockup).
- Category tag, H1, byline+date — unchanged data, restyled.
- Cover image → `BlueprintFrame` + `DuotonePhoto`.
- **Pull-quote treatment for `cover_letter`**: left-accent-bordered block, `font-family: var(--font-heading)`, 24px/34px, weight 500 — this is the *existing* `cover_letter` field, currently rendered plainly by `CoverLetterDisplay`; give blog posts this heavier pull-quote styling (visually distinct from the Educação callout in §5.2, which is a boxed note rather than a quote — same component, a style variant/prop for which context it's used in).
- Body content via existing `LexicalContent` — no change to the Lexical data model. The mockup's equation callout (`t_setup + t_logic + t_skew ≤ T_clk`, boxed, centered, captioned "Eq. 1 — …") is exactly what the existing KaTeX support already renders inline; just confirm the boxed/centered/captioned treatment when an equation is on its own line (may need a small CSS rule targeting the KaTeX display-mode wrapper, not a new feature).
- **Aside box 1, "Nesta página"** — an in-page table of contents linking to headings in the post. **This is new** and non-trivial (needs to walk the rendered content for `h3`/`h4` nodes and build anchors). See decision D3 in §7 — recommended as a **Phase 2 / optional** addition, not a blocker for shipping the redesign.
- **Aside box 2, "Termos citados"** — identical mechanism to Educação's "Termos usados aqui" (§5.2), same new `wikiApi.getLinksForContent` call with `contentType: 'blog'`.
- Share & cite — same as Educação, restyled.

---

## 6.4 Thumbnail fallback (used by Landing, Educação listing, and anywhere a `DuotonePhoto` has no `src`)

`DuotonePhoto` (§2.1) implements this once, centrally:

```tsx
{src ? (
  <div className="duotone"><img src={src} alt={alt} /></div>
) : (
  <div className="photo-slot" style={{ aspectRatio: '16/9' }}>
    {fallbackLabel}
  </div>
)}
```
For Educação cards specifically, `fallbackLabel` should be the **category name rendered large** (see mockup: a 32px condensed-uppercase watermark reading "Guias"/"Teóricos"/"Projetos" on a subtle diagonal-hatch background) rather than the generic `.photo-slot` caption text used elsewhere (hero, blog cards) — pass a `variant="category-watermark"` prop or similar to distinguish the two `.photo-slot` presentations.

## 6.5 Wiki + shared empty-state (artboards 1f, 1g) — `src/pages/WikiList.tsx`, `WikiDetail.tsx`, `NotFound.tsx`

- **`WikiList.tsx`**: populated state (1f) is a straightforward restyle — search input, "{n} termos · A–Z" caption, 2-column term cards (`BlueprintFrame`, term as `.card-title`, definition, "Também: {alias}" caption in `--color-accent-700`).
- **Empty state (1g) becomes the shared `BlankSheet` component** (§2.1): hatched `BlueprintFrame`, "Folha em branco" kicker, headline "A wiki começa agora", the existing empty-state copy, **and now also the grouped pending-term chips** ("DRC · 7", "Netlist · 5", "Tape-out · 4") plus two CTAs (`/educacao`, `/blog`).
  - **New backend requirement:** the data for those chips (`PendingWikiLinkGrouped[]` — the type already exists in `types/index.ts`) is currently only exposed via `authMiddleware`-gated routes (`/wiki/pending/all`, `/pending/count`, `/pending/term/:term` — see `backend/src/routes/wiki.ts:40-42`). Add one new **public** route, e.g. `GET /wiki/pending/grouped`, returning term+count only (never the linking content's id/title — that stays admin-only), and a matching `wikiApi.getPendingGrouped()` client method.
- **`WikiDetail.tsx` pending-term branch** (`slug.startsWith('pending-')`) — replace its current bespoke `Alert` + suggestion grid with the same `BlankSheet` component, headline = the requested term, body = "Esta entrada ainda não foi criada…", CTAs to Educação/Blog (drop the "outros tópicos" grid the mockup doesn't show for this state — the 1g note explicitly says pending-term and 404 share *this* pattern, not the populated-wiki grid).
- **`NotFound.tsx`** (added earlier this session) — same `BlankSheet`, headline "Página não encontrada", single CTA "Voltar para o início".

---

## 7. Open decisions (need a call before or during implementation)

**D1 — Eventos & Projetos as real nav items.** The mockup's nav includes them but never designs a destination for either (§1). Recommendation: **don't add them to the nav yet.** Keep today's 5 items (Início/Educação/Blog/Wiki/Sobre). If a "Projetos" entry point is wanted now, the lowest-scope version is a link to `/educacao` pre-filtered to the Projetos category (`/educacao?categoria=Projetos`, requires reading a query param in `Educacao.tsx` to set the initial tab — small, contained change). Eventos has no backing content type at all; treat as a separate future project (needs its own brainstorm: does an event need a date/location/RSVP schema, or is it just a special blog category?).

**D2 — "Ficha do projeto" fact table.** No structured fields exist for PDK/Ferramentas/Duração/Licença, and the Lexical editor has no table node (`@lexical/table` is not installed) to let admins author one inline. Three options, no clear winner without product input:
  (a) Skip the literal table; admins express this as a short bulleted list inside the existing `resources` field (zero code change).
  (b) Add `@lexical/table` to the editor (real editor feature, moderate scope, benefits all content types).
  (c) Add dedicated `pdk`/`tools`/`duration`/`license` columns to `education_resources`, admin-form fields, and a migration (schema change, but gives a real structured fact-sheet everywhere, not just where an admin remembers to format a list).
  **Recommendation: (a) for this pass**, revisit (b)/(c) only if this fact-sheet pattern is wanted on more than the one example resource in the mockup.

**D3 — "Nesta página" in-page table of contents on blog posts.** Not present anywhere else in the app, needs a heading-scanning utility with no obvious existing hook. Recommendation: **Phase 2 / optional**, ship the rest of the blog-post redesign without it first.

**D4 — Dark mode beyond the nav/hero/footer field.** The mockup (1b) only designs the *nav's* dark state; hero and footer are already the steel field in light mode too, so they need no dark-specific variant. But the rest of a page's background/card treatment in dark mode isn't specified by any of the six screens. Recommendation: derive it conservatively — page background → `--color-field-deep` (`#16222e`, the token already exists for "citation moments" per the branded readme, closest fit for a full dark ground), body text → `--color-on-field`, card borders → `--color-line-on-field`, everything else (accent, tags, buttons) unchanged since they're already tuned for use on a field per §2.3's "Do" rules. **Flag this to whoever approves the plan** — it's an inference, not a literal spec.

---

## 8. Suggested implementation order

1. **Phase 0 — foundation.** Copy the CSS files (§2.2) into the repo, wire the font import, rewrite `theme.ts`, pull the steel/white logo PNGs into `public/`, build `BlueprintFrame` / `DuotonePhoto` / `TitleBlockBar` / `BlankSheet`. Nothing user-visible changes yet; verify the app still builds and the existing Vitest suite (`npm test`) still passes.
2. **Phase 1 — chrome.** `Header`/nav (§3) and `Footer` (§4.8, including the settings-wiring fix). Verify on every page since these are global.
3. **Phase 2 — Landing** (§4) end to end.
4. **Phase 3 — Educação** listing + detail (§5), including the category-count and thumbnail-fallback work.
5. **Phase 4 — Blog post** (§6), skip D3 (TOC) initially.
6. **Phase 5 — Wiki + shared empty state** (§6.5), including the one small backend addition (`GET /wiki/pending/grouped`) and the `wikiApi.getLinksForContent` / `wikiApi.getPendingGrouped` client methods.
7. **Phase 6 — the rest of the site** (Blog listing, Wiki entry detail, About, Login) restyled to match using the same tokens/components, no new mockup to follow — apply §2.3's rules directly.
8. **Phase 7 — admin.** Not covered by any mockup; lowest priority. At minimum keep it functionally intact; a full admin re-skin is a separate future pass.

Each phase should end with: `npm run build` (frontend) clean, `npm test` (Vitest) still green, and a manual look at the page in both light and dark mode before moving on — this codebase has no visual regression tooling, so that manual check is the only safety net.
