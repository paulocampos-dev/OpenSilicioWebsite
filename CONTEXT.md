# OpenSilício — Migration Context

> Snapshot of project state before an OS migration. Use this to resume work on another machine after cloning from GitHub.

**Captured:** 2026-07-12  
**Repo:** `git@github.com:paulocampos-dev/OpenSilicioWebsite.git`  
**Branch:** `main`  
**HEAD at capture:** `3f57e71` — *Extend cover letters and thumbnails across content types and improve the editor.*

---

## 1. What this project is

OpenSilício is the website for a USP research/extension group on open microelectronics.

| Layer | Path | Stack |
|-------|------|-------|
| Frontend | `openSilicioWebsite/` | React 19, Vite 5, MUI 7, React Router 7, Lexical 0.37 |
| Backend | `backend/` | Node.js, Express, PostgreSQL, JWT |
| Deploy | `.github/workflows/`, `docker/` | Docker + Nginx (FE) + Express (BE), GitHub Actions → VPS |

UI redesign notes live in `UI_Specification.md` (living doc, last updated June 2026).

---

## 2. Git state at capture

- `main` was **1 commit ahead** of `origin/main` before this CONTEXT push.
- Working tree had **no real content diffs**. Four files looked dirty only because of Windows CRLF vs index LF:
  - `UI_Specification.md`
  - `backend/src/migrations/010_add_cover_letter_to_education_and_wiki.sql`
  - `openSilicioWebsite/src/components/CoverLetterDisplay.tsx`
  - `openSilicioWebsite/src/components/lexical/utils/imageUploadUtils.ts`
- Other local branches (not required for resume): `claude/funny-vaughan`, `claude/great-elbakyan`, `claude/nifty-blackburn`.

After cloning on the new OS:

```bash
git clone git@github.com:paulocampos-dev/OpenSilicioWebsite.git
cd OpenSilicioWebsite
git checkout main
git pull
```

---

## 3. Work included in HEAD (`3f57e71`)

This is the main unfinished-product surface to continue from. It extends earlier cover-letter work on posts into education/wiki and improves the Lexical editor.

### Cover letters (article intros)

- Posts already had optional `cover_letter`.
- **New:** nullable `cover_letter` on education resources and wiki entries.
- Migration: `backend/src/migrations/010_add_cover_letter_to_education_and_wiki.sql`
- Display: `CoverLetterDisplay` used on post / education resource / wiki detail pages.
- Admin forms: blog, education, wiki can edit the field.
- Validation/service/controller wiring in backend for education + wiki.

### Education thumbnails

- Migration: `backend/src/migrations/011_add_image_url_to_education.sql`
- Shared admin control: `ThumbnailUploadField`
- Wired into education admin form and listing/landing where relevant.

### Lexical editor / images

- Shared helpers: `imageUploadUtils.ts` (pick files, upload, insert single image or gallery).
- Richer single-image controls in `ImageNode` / `ImagePlugin`.
- Gallery: per-image delete and drag reorder (`ImageGalleryNode` / `ImageGalleryPlugin`).
- Upload size path aligned with 50MB limits (frontend warning + prior backend Zod/request-size work).

### Deploy / cache

- Frontend prod Docker/compose and deploy workflow tweaks for cache busting after FE deploys.
- Earlier commits on `main` also hardened SSH/backup checks in deploy.

### Docs

- `UI_Specification.md` — inventory of current UI, IA, theme, gaps for redesign.

---

## 4. Related recent history (already on main lineage)

| Commit | Summary |
|--------|---------|
| `f9f145c` | Optional cover letter on posts; safer deploy (DB backup before VPS deploy) |
| `f493fe4` | Harden deploy workflow SSH connectivity and backup checks |
| `3f57e71` | Cover letters + thumbnails across content types; Lexical image UX; UI spec |

---

## 5. Resume checklist (new machine)

1. Clone repo and use Node version matching the project (check `package.json` / lockfiles in `openSilicioWebsite/` and `backend/`).
2. Copy env files from secure storage (`.env` is not in git). Typical needs: DB URL, JWT secret, upload/storage config, API base URL for the frontend.
3. Install deps in both `backend/` and `openSilicioWebsite/`.
4. Run pending migrations (`010`, `011` and any earlier ones) against local/prod Postgres as appropriate.
5. Confirm uploads still work (image upload API + 50MB limits).
6. If continuing UI redesign: start from `UI_Specification.md`, not from scratch.
7. Optional: ignore CRLF noise on Windows with `core.autocrlf` / `.gitattributes` if status shows false dirty files again.

---

## 6. Open / known follow-ups (from this line of work)

- Apply/verify migrations `010` and `011` on any environment that has not received them yet.
- Smoke-test cover letter on blog, educação resource, and wiki detail (empty vs filled).
- Smoke-test education thumbnail upload + display on listing/cards.
- Smoke-test Lexical: single image insert, multi-image gallery, delete, reorder, large upload rejection.
- Deploy once after OS move to confirm GitHub Actions → VPS path still works with SSH/backup hardening.
- UI redesign work is specified but not implemented as a full redesign yet — `UI_Specification.md` is the source of truth for that track.

---

## 7. Do not lose

- SSH / deploy secrets and VPS access (outside the repo).
- Database backups produced by the deploy workflow.
- Any local `.env` / credential files that were never committed.
- This file (`CONTEXT.md`) as the handoff brief for the next session.
