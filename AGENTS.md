# OpenSilício Website

The website for OpenSilício, a USP (Escola Politécnica) research/extension
group on open microelectronics. It serves a public blog, an "Educação"
resource library (guides/projects/tutorials/theory), and a cross-linked wiki
of technical terms, plus an admin panel for authoring all of it.

## Stack & layout

- `openSilicioWebsite/` — frontend: React 19, Vite 5, MUI 7, React Router 7,
  Lexical 0.37 (rich text editor), framer-motion (interaction/animation).
- `backend/` — Node.js + Express + PostgreSQL, JWT auth.
- `docker/` — dev and prod Docker Compose setups.
- `.github/workflows/deploy.yml` — pushing to `main` deploys straight to the
  production VPS (see **Deployment** below).
- `README/` — deeper docs (deployment, scripts, dev setup, data safety).
  `README.md` at the repo root is the quick-start entry point.

## Local development

Use `scripts/development/start.sh` (or `.bat` on Windows) to bring up
Postgres + backend + frontend in Docker with hot reload. See `README.md` /
`README/DEVELOPMENT_GUIDE.md` for the full setup, local admin credentials,
and non-Docker alternatives.

- Frontend: http://localhost:5173 — `npm run dev` / `npm run build` /
  `npm run test` (Vitest) / `npm run lint` inside `openSilicioWebsite/`.
  Note: ESLint's TS parsing is currently broken repo-wide — don't treat a
  failing `lint` run as a signal on code you touched unless you introduced
  the specific error.
- Backend: http://localhost:3001 — `npm run dev` / `npm run build` /
  `npm test` (Jest) inside `backend/`.

### Database migrations

Add a new numbered `.sql` file under `backend/src/migrations/`. Run
migrations with `npx ts-node src/migrations/migrate.ts` directly rather than
`npm run migrate` — that script prefers a compiled `dist/migrations/migrate.js`
if one exists, which silently goes stale after a `tsc`/`build` and can look
like "0 pending migrations" even when your new migration hasn't run.

## Making changes

- **Design system**: the public site follows the "Industry" design system —
  steel-blue accent, Barlow/Barlow Condensed type, a blueprint/corner-mark
  motif, square corners everywhere. Tokens and patterns live in
  `openSilicioWebsite/src/styles/design-system/`; reusable pieces (frames,
  photos, skeletons, the wiki popover, etc.) live in
  `openSilicioWebsite/src/components/design/`. Reuse those instead of
  hand-rolling corner marks, hairline borders, or ad-hoc skeleton shimmer.
- **Dark mode**: driven by a `data-color-mode` attribute on `<html>` (see
  `App.tsx`/`theme.ts`), not just MUI's `theme.palette.mode` — plain-CSS
  design-system rules must also branch on `:root[data-color-mode="dark"]` to
  stay mode-aware.
- **Animation**: framer-motion is the standard for interactive motion.
  Prefer compositor-only properties (`transform`/`opacity`), respect
  `useReducedMotion()`, and keep it purposeful — feedback, spatial
  continuity, or preventing a jarring change, not decoration for its own
  sake. High-frequency UI (buttons, tags, filters used constantly) should
  stay fast and subtle.
- **TypeScript**: both apps run in strict mode; the frontend additionally
  enables `exactOptionalPropertyTypes`. Avoid `any`; prefer inferred/narrow
  types over hand-widened ones.
- Verify a change with the actual build/test commands above (and the
  browser, for UI work) before considering it done — don't rely on `lint`
  alone given the current ESLint breakage.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes into
the production VPS and: backs up the Postgres database, pulls `main`,
rebuilds and restarts the Docker containers, then runs pending migrations.
This is a real, immediate production deploy with no staging step — treat a
push to `main` accordingly (verify the change locally first, watch the
Action run, and check the live site after).
