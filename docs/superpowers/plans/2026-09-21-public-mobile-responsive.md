# Public Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve mobile filtering, touch targets, heading semantics, and loading motion across the public site while preserving the Industry visual design.

**Architecture:** Keep desktop navigation and filters unchanged. Add a mobile-only bottom filter drawer that shares the existing Educação state, correct semantic heading elements without changing visual tokens, and make mobile touch and reveal behavior explicit through shared CSS and existing components.

**Tech Stack:** React 19, TypeScript strict mode, MUI 7, Framer Motion 13, React Router 7, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-21-mobile-responsive-design.md`

## Global Constraints

- Desktop behavior at 900 px and above remains unchanged.
- Mobile behavior targets widths from 320 px through 899 px.
- Primary touch controls are at least 48 px; secondary controls are at least 44 px.
- Keep true-black dark mode, square corners, dense layout, Barlow typography, and steel-blue accents.
- Use only `transform` and `opacity` for animation and honor `prefers-reduced-motion`.
- Do not change public data queries, pagination, course progress, or content formats.
- Do not add a dependency.

## Review Focus

- Filter state must survive drawer open and close, pagination resets, and device rotation.
- One API source failing must still show the other source, as the current Educação page does.
- A 320 px page must not gain horizontal overflow from chips, code, breadcrumbs, or footer links.
- Heading fixes must preserve visual sizes and produce exactly one `h1` on every public list or landing page.
- Reduced-motion and mobile users must never wait through a low-opacity loaded state.

---

### Task 1: Mobile Educação filter drawer

**Files:**
- Modify: `openSilicioWebsite/src/pages/Educacao.test.ts`
- Modify: `openSilicioWebsite/src/pages/Educacao.tsx`

**Interfaces:**
- Consumes: existing `tab`, `level`, `query`, `counts`, and `usePagedFilter` state.
- Produces: mobile `Filtros` bottom drawer and active-filter summary using the same state as desktop controls.

- [ ] **Step 1: Extend the test fixture and add failing interaction tests**

Mock `educationApi.getAll` and `cursosApi.getAll` with complete response objects containing the existing `recurso` and `curso` fixtures. Render `Educacao` in `MemoryRouter` and add:

```tsx
it('filters from the mobile drawer and exposes a removable summary', async () => {
  const user = userEvent.setup()
  renderEducacao()

  await user.click(await screen.findByRole('button', { name: 'Filtros' }))
  await user.click(screen.getByRole('button', { name: 'Tutoriais' }))
  await user.click(screen.getByRole('button', { name: 'Iniciante' }))
  await user.click(screen.getByRole('button', { name: 'Ver resultados' }))

  expect(screen.getByRole('button', { name: 'Remover filtro Tutoriais' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Remover filtro Iniciante' })).toBeVisible()
  expect(screen.getByRole('link', { name: /Simulando no SiliWiz/i })).toBeVisible()
})

it('clears active category and level without clearing the search query', async () => {
  const user = userEvent.setup()
  renderEducacao()
  await user.type(screen.getByRole('searchbox', { name: 'Buscar recursos' }), 'SiliWiz')
  await user.click(screen.getByRole('button', { name: 'Filtros' }))
  await user.click(screen.getByRole('button', { name: 'Tutoriais' }))
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

  expect(screen.getByRole('searchbox', { name: 'Buscar recursos' })).toHaveValue('SiliWiz')
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/pages/Educacao.test.ts`

Expected: FAIL because `Filtros` and its drawer do not exist.

- [ ] **Step 3: Implement a shared-state mobile filter surface**

Render the search first on all widths. Keep the current category and level controls inside a desktop container with `display: { xs: 'none', md: 'flex' }`. Add a mobile 48 px `Filtros` button and `Drawer anchor="bottom"` with square paper, named category and level groups, 44 px filter controls, `Limpar filtros`, and `Ver resultados`.

Show removable active-filter buttons below the search when `tab !== 'Todos'` or `level !== 'Todos'`. Removing a summary restores only that dimension to `Todos`. Do not copy filter state into a second draft object.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/pages/Educacao.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/pages/Educacao.tsx openSilicioWebsite/src/pages/Educacao.test.ts
git commit -m "feat(education): add mobile filters"
```

### Task 2: Public heading semantics

**Files:**
- Modify: `openSilicioWebsite/src/pages/Landing.test.tsx`
- Create: `openSilicioWebsite/src/pages/PublicHeadings.test.tsx`
- Modify: `openSilicioWebsite/src/pages/Landing.tsx`
- Modify: `openSilicioWebsite/src/pages/About.tsx`
- Modify: `openSilicioWebsite/src/pages/Educacao.tsx`
- Modify: `openSilicioWebsite/src/pages/Blog.tsx`
- Modify: `openSilicioWebsite/src/pages/Cursos.tsx`
- Modify: `openSilicioWebsite/src/pages/WikiList.tsx`

**Interfaces:**
- Consumes: current page data and visual `sx`/variant values.
- Produces: exactly one `h1` per page and sequential section/card heading levels.

- [ ] **Step 1: Add failing semantic tests**

Extend the Landing test:

```tsx
expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
expect(screen.getByRole('heading', { name: 'Microeletrônica aberta, na Poli', level: 2 })).toBeVisible()
expect(screen.getByRole('heading', { name: 'Educação estruturada', level: 3 })).toBeVisible()
```

In `PublicHeadings.test.tsx`, mock each page's external API at its boundary and render About, Educação, Blog, Cursos, and WikiList separately. For each render, assert `screen.getAllByRole('heading', { level: 1 })` has length 1. For About, also assert `Nossa Missão`, `Nossa Visão`, `Nossa História`, and `Nossa Equipe` are level 2 when their complete fixture data is present.

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/pages/Landing.test.tsx src/pages/PublicHeadings.test.tsx`

Expected: FAIL because Landing skips from `h1` to `h3`, About has no `h1`, and list pages use `h2` headings.

- [ ] **Step 3: Correct elements without changing appearance**

Set the page title of About, Educação, Blog, Cursos, and WikiList to `component="h1"`. Change Landing section headings to `h2` and offering/card headings to `h3`. Change About major sections to `h2` and team member names to `h3`. Preserve every existing font size, weight, line height, color, spacing, and text transform through `sx` or the existing `variant`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/pages/Landing.test.tsx src/pages/PublicHeadings.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/pages/Landing.tsx openSilicioWebsite/src/pages/Landing.test.tsx openSilicioWebsite/src/pages/About.tsx openSilicioWebsite/src/pages/Educacao.tsx openSilicioWebsite/src/pages/Blog.tsx openSilicioWebsite/src/pages/Cursos.tsx openSilicioWebsite/src/pages/WikiList.tsx openSilicioWebsite/src/pages/PublicHeadings.test.tsx
git commit -m "fix(a11y): correct public heading hierarchy"
```

### Task 3: Mobile reveal behavior

**Files:**
- Create: `openSilicioWebsite/src/components/design/RevealOnLoad.test.tsx`
- Modify: `openSilicioWebsite/src/components/design/RevealOnLoad.tsx`

**Interfaces:**
- Consumes: Framer Motion `useReducedMotion`, MUI `useMediaQuery` and theme breakpoint.
- Produces: desktop fade and rise; immediate full-opacity content on mobile or reduced motion.

- [ ] **Step 1: Write failing branch tests**

Mock `useReducedMotion` and MUI `useMediaQuery` separately. Assert the rendered motion element receives the visible state immediately on mobile and when reduced motion is true, while desktop retains the 0.22 second transition:

```tsx
expect(screen.getByTestId('reveal')).toHaveStyle({ opacity: '1', transform: 'none' })
```

Use `<RevealOnLoad data-testid="reveal">Conteúdo</RevealOnLoad>` and reset both mocks between cases.

- [ ] **Step 2: Run the test and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/components/design/RevealOnLoad.test.tsx`

Expected: FAIL because mobile still starts at zero opacity and reduced motion still fades.

- [ ] **Step 3: Implement immediate mobile and reduced-motion rendering**

Derive `immediate = mobile || reduce`. When true, set `initial={false}` and omit translation. When false, keep `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, and the existing 0.22 second ease-out transition. Do not add a new animation.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/components/design/RevealOnLoad.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/components/design/RevealOnLoad.tsx openSilicioWebsite/src/components/design/RevealOnLoad.test.tsx
git commit -m "fix(motion): reveal mobile content immediately"
```

### Task 4: Mobile touch targets and overflow containment

**Files:**
- Modify: `openSilicioWebsite/src/styles/design-system/patterns/ui.css`
- Modify: `openSilicioWebsite/src/components/Footer.tsx`
- Modify: `openSilicioWebsite/src/pages/Aula.tsx`

**Interfaces:**
- Consumes: existing `.btn`, `.btn-icon`, `.input`, `.filter-pill`, footer links, and lesson controls.
- Produces: mobile touch areas that meet the spec without changing desktop density.

- [ ] **Step 1: Record behavioral RED measurements in a real browser**

At 390 by 844 on the current implementation, measure the bounding rectangles of the public theme button, menu button, Educação search, one level filter, one lesson progress button, and one footer resource link. Record the current values in the plan ledger. Expected RED: at least one icon is 40 px, search is about 41 px, level filter is about 28 px, lesson button is about 40 px, and footer link is about 23 px.

- [ ] **Step 2: Add mobile-only touch rules**

In `ui.css`, add a `max-width: 899.95px` rule that sets `.btn-icon` to 48 px square, `.input` to at least 48 px, `.filter-pill` and public `.btn` to at least 44 px, and touch-safe gaps. Add a `footer-nav-link` class to navigation links in `Footer.tsx` and give it a 44 px inline-flex touch area on mobile. Apply a 44 px minimum height to the existing lesson progress/navigation controls in `Aula.tsx` without changing progress logic.

- [ ] **Step 3: Verify GREEN measurements**

Run the local app at 390 by 844 and repeat the exact bounding-rectangle measurements. Expected: icon buttons are at least 48 px and every other named control is at least 44 px. Confirm the header remains on one line at 320 px and the footer does not gain horizontal overflow.

- [ ] **Step 4: Commit**

```bash
git add openSilicioWebsite/src/styles/design-system/patterns/ui.css openSilicioWebsite/src/components/Footer.tsx openSilicioWebsite/src/pages/Aula.tsx
git commit -m "fix(ui): enlarge mobile touch targets"
```

### Task 5: Public responsive verification

**Files:**
- No source files.

**Interfaces:**
- Consumes: Tasks 1 through 4.
- Produces: verification evidence across routes, themes, orientations, and accessibility settings.

- [ ] **Step 1: Run the full frontend checks**

Run: `cd openSilicioWebsite && npm run typecheck && npm test && npm run build`

Expected: all commands exit 0. Report any pre-existing failure by name.

- [ ] **Step 2: Inspect representative routes**

Test `/`, `/educacao`, `/cursos`, one course, one lesson, `/blog`, `/wiki`, and `/sobre` at 320 by 568, 390 by 844, 768 by 1024, 844 by 390, and 1280 px wide. Repeat the core pages in light and dark mode and with reduced motion.

- [ ] **Step 3: Verify browser invariants**

For each route, evaluate `document.documentElement.scrollWidth <= window.innerWidth`. Confirm a single `h1`, keyboard-operable filters, focus restoration after closing the filter drawer, retained search/filter state after rotation, and immediate loaded content on mobile. Confirm desktop Educação filters remain visible and unchanged.

- [ ] **Step 4: Record completion without a source-only commit**

If verification requires no correction, do not create an empty commit. If a failure appears, add a failing automated test or repeatable browser measurement, implement the minimum correction, run the whole frontend suite, and commit as `fix(ui): correct public mobile regression`.
