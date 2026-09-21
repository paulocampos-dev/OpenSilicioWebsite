# Admin Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every administrative workflow usable from 320 px without changing desktop behavior or data flows.

**Architecture:** Keep the current desktop tables and permanent drawer. Add a temporary mobile drawer, a small shared mobile-list shell with contextual actions, and responsive variants inside the existing pages. All breakpoints use MUI `md`; no backend or persistence code changes.

**Tech Stack:** React 19, TypeScript strict mode, MUI 7, React Router 7, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-21-mobile-responsive-design.md`

## Global Constraints

- Desktop behavior at 900 px and above remains unchanged.
- Mobile behavior targets widths from 320 px through 899 px.
- Primary touch controls are at least 48 px; secondary controls are at least 44 px.
- No document-level horizontal overflow at 320 px.
- Keep square corners and existing MUI/admin visual language.
- Do not change APIs, database schemas, content formats, publishing rules, or Lexical save behavior.
- Respect strict TypeScript and `exactOptionalPropertyTypes`; do not add `any`.

## Review Focus

- A route change while the temporary drawer is open must close it without logging the user out.
- A long title or slug must wrap inside its row rather than widening the page.
- Every desktop action must remain available in the corresponding mobile menu, including destructive confirmations.
- The sticky creation bar must not cover the final activity or the bottom safe area.
- Lexical toolbar overflow must remain inside its own scroller and must not inject or mutate contenteditable DOM.

---

### Task 1: Responsive admin navigation

**Files:**
- Create: `openSilicioWebsite/src/components/AdminLayout.test.tsx`
- Modify: `openSilicioWebsite/src/components/AdminLayout.tsx`

**Interfaces:**
- Consumes: `useAuth(): { logout: () => void }`, React Router `useLocation`, MUI `useMediaQuery`.
- Produces: `AdminLayout` with permanent desktop navigation and temporary mobile navigation using the same `menuItems` data.

- [ ] **Step 1: Write the failing mobile navigation tests**

Create a test harness that mocks `useAuth`, mocks `useMediaQuery` to return `true`, and renders `AdminLayout` in a `MemoryRouter`. Add these tests:

```tsx
it('opens mobile navigation and closes it after selecting a route', async () => {
  const user = userEvent.setup()
  renderAdminLayout()

  await user.click(screen.getByRole('button', { name: 'Abrir navegação' }))
  expect(screen.getByRole('presentation')).toHaveTextContent('Cursos')

  await user.click(screen.getByRole('link', { name: 'Cursos' }))
  await waitFor(() => {
    expect(screen.queryByRole('link', { name: 'Cursos' })).not.toBeVisible()
  })
})

it('moves site and logout actions into the mobile drawer', async () => {
  const user = userEvent.setup()
  renderAdminLayout()
  expect(screen.queryByRole('link', { name: 'Ver site' })).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Abrir navegação' }))
  expect(screen.getByRole('link', { name: 'Ver site' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
})
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/components/AdminLayout.test.tsx`

Expected: FAIL because no `Abrir navegação` button exists.

- [ ] **Step 3: Implement the responsive drawer**

In `AdminLayout.tsx`:

```tsx
const theme = useTheme()
const mobile = useMediaQuery(theme.breakpoints.down('md'))
const location = useLocation()
const [drawerOpen, setDrawerOpen] = useState(false)

useEffect(() => setDrawerOpen(false), [location.pathname])
```

Render an `IconButton` with `MenuIcon`, `aria-label="Abrir navegação"`, and a 48 px square hit area only on mobile. Use `variant={mobile ? 'temporary' : 'permanent'}` and `open={mobile ? drawerOpen : true}`. Set the paper width to `min(280px, calc(100vw - 48px))`. Move `Ver site` and `Sair` into the drawer on mobile. Keep them in the AppBar on desktop. Give active `ListItemButton` elements `selected` and `aria-current="page"`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/components/AdminLayout.test.tsx`

Expected: PASS with no warnings.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/components/AdminLayout.tsx openSilicioWebsite/src/components/AdminLayout.test.tsx
git commit -m "fix(admin): make navigation responsive"
```

### Task 2: Shared mobile row and contextual menu

**Files:**
- Create: `openSilicioWebsite/src/components/admin/AdminMobileItem.tsx`
- Create: `openSilicioWebsite/src/components/admin/AdminMobileItem.test.tsx`

**Interfaces:**
- Consumes: MUI `Paper`, `IconButton`, `Menu`, `Stack`; caller-owned `MenuItem` children.
- Produces:

```ts
interface AdminMobileItemProps {
  title: string
  details: ReactNode
  status?: ReactNode
  actions: ReactNode
}
```

- [ ] **Step 1: Write the failing behavior test**

```tsx
it('names the action button with the record and reveals caller actions', async () => {
  const user = userEvent.setup()
  render(
    <AdminMobileItem
      title="Projeto Digital"
      details={<span>6 módulos</span>}
      status={<span>Publicado</span>}
      actions={<MenuItem>Editar</MenuItem>}
    />,
  )

  expect(screen.getByText('6 módulos')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Ações de Projeto Digital' }))
  expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeVisible()
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/components/admin/AdminMobileItem.test.tsx`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the smallest shared component**

Manage only the menu anchor internally. Render title, details, status, and a 48 px `MoreVertIcon` button. Use `overflowWrap: 'anywhere'` and `minWidth: 0` on text containers. Close the menu after any bubbled action click. Do not encode record-specific actions or routing.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/components/admin/AdminMobileItem.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/components/admin/AdminMobileItem.tsx openSilicioWebsite/src/components/admin/AdminMobileItem.test.tsx
git commit -m "feat(admin): add mobile list item"
```

### Task 3: Responsive admin content lists

**Files:**
- Create: `openSilicioWebsite/src/pages/admin/CursoList.test.tsx`
- Create: `openSilicioWebsite/src/pages/admin/BlogList.test.tsx`
- Create: `openSilicioWebsite/src/pages/admin/EducationList.test.tsx`
- Create: `openSilicioWebsite/src/pages/admin/WikiList.mobile.test.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/CursoList.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/BlogList.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/EducationList.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/WikiList.tsx`

**Interfaces:**
- Consumes: `AdminMobileItem` from Task 2 and the pages' existing API responses and handlers.
- Produces: desktop tables shown at `md` and above, mobile lists shown below `md`, with equivalent actions.

- [ ] **Step 1: Write failing action-equivalence tests**

For each page, mock only its existing API module with one complete record and render it in a `MemoryRouter`. Verify the mobile record action menu exposes the same user operations as the table. For Cursos:

```tsx
expect(await screen.findByText('Projeto Digital')).toBeVisible()
await user.click(screen.getByRole('button', { name: 'Ações de Projeto Digital' }))
expect(screen.getByRole('menuitem', { name: 'Editar estrutura' })).toHaveAttribute(
  'href',
  '/admin/cursos/projeto-digital/estrutura',
)
expect(screen.getByRole('menuitem', { name: 'Editar curso' })).toHaveAttribute(
  'href',
  '/admin/cursos/editar/curso-1',
)
expect(screen.getByRole('menuitem', { name: 'Deletar' })).toBeVisible()
```

Blog must expose `Publicar` only for drafts plus `Editar` and `Deletar`. Educação must expose `Publicar` only for drafts plus `Editar` and `Deletar`. Wiki must expose its existing edit, publication, and deletion operations without changing pending-link behavior.

- [ ] **Step 2: Run all four tests and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/pages/admin/CursoList.test.tsx src/pages/admin/BlogList.test.tsx src/pages/admin/EducationList.test.tsx src/pages/admin/WikiList.mobile.test.tsx`

Expected: FAIL because the record-specific action buttons do not exist.

- [ ] **Step 3: Add mobile lists without removing desktop tables**

For every page:

```tsx
<TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
  {/* existing table unchanged */}
</TableContainer>
<Stack spacing={1} sx={{ display: { xs: 'flex', md: 'none' } }}>
  {/* AdminMobileItem per record */}
</Stack>
```

Make page headers stack on `xs` and return to a row on `sm`. Use full-width 48 px create buttons on `xs`. Reuse the existing handlers so confirmations, publication, reloads, and Snackbars remain single-sourced.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/pages/admin/CursoList.test.tsx src/pages/admin/BlogList.test.tsx src/pages/admin/EducationList.test.tsx src/pages/admin/WikiList.mobile.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/pages/admin/CursoList.tsx openSilicioWebsite/src/pages/admin/CursoList.test.tsx openSilicioWebsite/src/pages/admin/BlogList.tsx openSilicioWebsite/src/pages/admin/BlogList.test.tsx openSilicioWebsite/src/pages/admin/EducationList.tsx openSilicioWebsite/src/pages/admin/EducationList.test.tsx openSilicioWebsite/src/pages/admin/WikiList.tsx openSilicioWebsite/src/pages/admin/WikiList.mobile.test.tsx
git commit -m "fix(admin): adapt content lists for mobile"
```

### Task 4: Responsive course structure actions

**Files:**
- Modify: `openSilicioWebsite/src/pages/admin/CursoEstrutura.test.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/CursoEstrutura.tsx`

**Interfaces:**
- Consumes: existing `trocar`, `atividadesDoModulo`, API handlers, `AdminMobileItem` action-menu behavior.
- Produces: mobile module and activity menus plus a mobile sticky creation bar, while preserving desktop icon controls.

- [ ] **Step 1: Add failing tests for the mobile menus**

Extend the current fixture and test:

```tsx
await user.click(await screen.findByRole('button', { name: 'Ações do módulo Transistores' }))
expect(screen.getByRole('menuitem', { name: 'Mover módulo para baixo' })).toBeVisible()
expect(screen.getByRole('menuitem', { name: 'Renomear módulo' })).toBeVisible()
expect(screen.getByRole('menuitem', { name: 'Deletar módulo' })).toBeVisible()

await user.click(screen.getByRole('button', { name: 'Ações de Simulando uma célula padrão' }))
expect(screen.getByRole('menuitem', { name: 'Editar aula' })).toHaveAttribute(
  'href',
  '/admin/cursos/projeto-digital/aulas/aula-1',
)

expect(screen.getByTestId('mobile-create-actions')).toHaveStyle({ position: 'sticky' })
```

Retain the existing quiz deletion test to prove destructive behavior remains wired to `cursosApi.deletarQuiz`.

- [ ] **Step 2: Run the test and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/pages/admin/CursoEstrutura.test.tsx`

Expected: FAIL because module and activity contextual menus are absent.

- [ ] **Step 3: Implement responsive menus and sticky actions**

Keep desktop icon buttons under `display: { xs: 'none', md: 'flex' }`. Add mobile `AdminMobileItem` menus with explicit labels for moving, editing, publishing, and deleting. Use each module's existing `Nova aula` and `Novo quiz` routes in a sticky action row shown only below `md`. Reserve bottom padding on the module paper equal to the bar height plus `env(safe-area-inset-bottom)`. A disabled move remains disabled in the menu.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/pages/admin/CursoEstrutura.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add openSilicioWebsite/src/pages/admin/CursoEstrutura.tsx openSilicioWebsite/src/pages/admin/CursoEstrutura.test.tsx
git commit -m "fix(admin): make course structure mobile friendly"
```

### Task 5: Responsive forms and Lexical toolbar containment

**Files:**
- Create: `openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.mobile.test.tsx`
- Modify: `openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/AulaForm.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/CursoForm.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/QuizForm.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/BlogForm.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/EducationForm.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/WikiForm.tsx`
- Modify: `openSilicioWebsite/src/pages/admin/Settings.tsx`

**Interfaces:**
- Consumes: the current Lexical command buttons and each form's existing submit handler.
- Produces: a toolbar whose overflow is local, plus stacked mobile form headers and field groups.

- [ ] **Step 1: Write the failing toolbar boundary test**

Render the real `ToolbarPlugin` inside the same minimal Lexical composer pattern used by existing plugin tests and assert:

```tsx
const toolbar = screen.getByRole('toolbar')
expect(toolbar).toHaveStyle({ overflowX: 'auto' })
expect(screen.getByRole('button', { name: 'Negrito' })).toHaveStyle({ minWidth: '44px' })
```

The production change this catches is restoring wrapping or 30 px controls that widen the form or miss touch targets.

- [ ] **Step 2: Run the test and verify RED**

Run: `cd openSilicioWebsite && npm test -- src/components/lexical/plugins/ToolbarPlugin.mobile.test.tsx`

Expected: FAIL because the toolbar wraps and buttons have no 44 px minimum.

- [ ] **Step 3: Implement local toolbar scrolling and responsive form stacks**

Set the toolbar to `flexWrap: { xs: 'nowrap', md: 'wrap' }`, `overflowX: { xs: 'auto', md: 'visible' }`, and apply `minWidth: { xs: 44, md: 30 }`, `minHeight: { xs: 44, md: 30 }` to its `IconButton` descendants. Keep the toolbar outside contenteditable.

Change form header stacks to `direction={{ xs: 'column', sm: 'row' }}`, `alignItems={{ xs: 'stretch', sm: 'center' }}`, and give the submit button a 48 px mobile minimum. Change side-by-side field groups to responsive directions without changing field names, validation, controlled values, or submit functions.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `cd openSilicioWebsite && npm test -- src/components/lexical/plugins/ToolbarPlugin.mobile.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the admin regression tests**

Run: `cd openSilicioWebsite && npm test -- src/components/AdminLayout.test.tsx src/components/admin/AdminMobileItem.test.tsx src/pages/admin/CursoList.test.tsx src/pages/admin/BlogList.test.tsx src/pages/admin/EducationList.test.tsx src/pages/admin/WikiList.mobile.test.tsx src/pages/admin/CursoEstrutura.test.tsx src/pages/admin/QuizForm.test.tsx src/components/lexical/plugins/ToolbarPlugin.mobile.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.tsx openSilicioWebsite/src/components/lexical/plugins/ToolbarPlugin.mobile.test.tsx openSilicioWebsite/src/pages/admin/AulaForm.tsx openSilicioWebsite/src/pages/admin/CursoForm.tsx openSilicioWebsite/src/pages/admin/QuizForm.tsx openSilicioWebsite/src/pages/admin/BlogForm.tsx openSilicioWebsite/src/pages/admin/EducationForm.tsx openSilicioWebsite/src/pages/admin/WikiForm.tsx openSilicioWebsite/src/pages/admin/Settings.tsx
git commit -m "fix(admin): contain forms on mobile"
```

### Task 6: Admin verification at real viewports

**Files:**
- No source files.

**Interfaces:**
- Consumes: Tasks 1 through 5.
- Produces: verification evidence for width, touch, theme, and desktop stability.

- [ ] **Step 1: Run the full frontend checks**

Run: `cd openSilicioWebsite && npm run typecheck && npm test && npm run build`

Expected: all commands exit 0. Report any pre-existing failure by name instead of hiding it.

- [ ] **Step 2: Run the local site against representative data**

Start the normal local frontend or the documented read-only production proxy. Do not write production data. Inspect Dashboard, Cursos, Blog, Educação, Wiki, course structure, Aula form, Quiz form, and one Lexical form at 320, 390, 768, and 900 px.

- [ ] **Step 3: Verify browser invariants**

For every inspected page, evaluate `document.documentElement.scrollWidth <= window.innerWidth`. Confirm 48 px primary and 44 px secondary hit targets, menu keyboard operation, light and dark themes, and an 844 by 390 landscape viewport. Confirm the desktop drawer and tables are unchanged at 1280 px.

- [ ] **Step 4: Record completion without a source-only commit**

If verification requires no correction, do not create an empty commit. If a failure appears, add a failing test that reproduces it, implement the minimum correction, run the whole frontend suite, and commit as `fix(admin): correct responsive regression`.
