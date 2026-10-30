<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Open Daycare — Next.js 16.4.3 (App Router) + React 19.3 + TypeScript strict + Tailwind v4. Package manager is **npm** (commit `package-lock.json`). No test runner; the UI is still static over mock data and the Supabase schema is **being migrated table by table** from `../07-DB-Schema` (see the **Supabase** section for the migration-file rule).

- **The mockups are the product spec**: `references/pantallas/*.dc.html` (Spanish daycare app: login, feed, niños, avisos, resumen del día…). Read the `.dc.html` of a screen before building it; polished renders of the target look are in `references/screenshots/`. Copy and palette come from there, not from your taste.
- `references/pantallas/support.js` is GENERATED ("do not edit"); its `dc-runtime` source is not in this repo — never modify or rebuild it here.
- `references/**` is excluded from ESLint (`eslint.config.mjs`) — the mockups are not linted and not shipped.
- Path alias: `@/*` → repo root. Typed routes are on: type props as `LayoutProps<"/">` / `PageProps<"/kids/[id]">` (globally generated in `.next/types/routes.d.ts`), never hand-write prop types for pages.

## Structure (Nuxt-style folders)

- `app/` — routing/layouts only (Next.js convention, keep intact): route group `app/(app)/` holds the shared shell (`layout.tsx` = `<Sidebar/>` + scrollable `<main>`) and its pages. `/login` and `/register` live **outside** that group (no sidebar).
- `components/<feature>/` — UI split per feature (`feed/`, `kids/`, `login/`, `layout/`), cross-cutting code in `components/common/<concern>/` (`icons/Icons.tsx`, `ui/CustomButton.tsx`, `ui/CustomInput.tsx`). File names are **PascalCase**.
- `data/<feature>/` — mock data for that feature (`data/feed/mock-posts.ts`), kebab-case file names. No Next.js special meaning; routing lives only in `app/`.
- Never put feature UI inside `app/` pages; import via the `@/*` alias.

## Commands

- `npm run dev` — dev server (Turbopack; also regenerates the `nextjs-agent-rules` block above)
- `npm run lint` — ESLint flat config (`eslint-config-next`), lints the whole repo
- `npm run build` — production build
- `npx tsc --noEmit` — typecheck (no script exists for it)
- `node scripts/canonical-classes.mjs [--fix]` — reports/fixes Tailwind classes that are not in canonical form (mirrors the VS Code `tailwindCSS.lint.suggestCanonicalClasses` setting). Run it after writing classes; the repo is expected to be canonical-class clean.
- Verification order used by specs/verifier: `npm run lint` → `npx tsc --noEmit` → `npm run build`; visual criteria are checked with the Playwright MCP (dev server on `http://localhost:3000`).

## next.config.ts gotchas

- `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback` are enabled — check the bundled docs before assuming default caching/rendering behavior.
- Tailwind v4 is wired via the Turbopack loader rule (`@tailwindcss/turbopack`). Styling is CSS-first (`@theme` in `app/globals.css`); there is no `tailwind.config.js`. Theme tokens are Spanish-named (`--color-acento`, `--color-fondo`, `--color-tinta`, …) → use them as `bg-acento`, `text-tinta`.

## Code conventions worth knowing

- Code (identifiers, files) in English; visible strings in Spanish (mockup copy).
- Tailwind v4 does not see runtime-built classes: rotation on icons uses inline `style={{ transform: \`rotate(${rotate}deg)\` }}`, never `rotate-[${n}deg]`.
- One `ChevronIcon` in `components/common/icons/Icons.tsx` with a `rotate` prop (`0` down, `90` left, `-90` right). Do not add directional chevron components.
- Reuse `components/common/ui/CustomButton.tsx` (`variant`: `primary|cancel|save`, `size`: `md|lg`) and `CustomInput.tsx` (`variant`: `field|bare`) instead of new local button/input markup.

## Spec-driven workflow (`.agents/skills/`)

- Specs live in `specs/` as `NN-name.md`, written in Spanish with a `> **Estado:**` header (`Borrador` → `Aprovado` → `Implementado`). `specs/.spec-config.yml` holds `AutoCreateBranch`.
- **Specs are categorized by scope** (see below): `specs/app/` for everything that touches the application (UI, components, routes, mock data) and `specs/databases/` for everything that touches the database (migrations, seeders, RLS, schema, triggers). `specs/.spec-config.yml` stays at the root of `specs/`.
  - A spec that changes the app goes to `specs/app/NN-slug.md`; a spec that changes the database (migration or seeder) goes to `specs/databases/NN-slug.md`. A spec that touches both is split in two: one per folder, each with its own number.
  - **Numbering is global and correlative across both folders** (`specs/app/01-…`, `specs/databases/11-…`, `specs/app/13-…`). The number identifies the spec anywhere; the folder only says what it touches. When starting a new spec, take the highest number that exists in either folder and add one.
  - `/spec` and `/spec-impl` must look for the file in both folders: a spec may be referenced by its full path (`specs/databases/12-users-table`), by its number (`12`) or by its slug (`12-users-table`).
- `/spec <feature>` — designs a spec only; never writes code. Saves `specs/app/NN-slug.md` or `specs/databases/NN-slug.md` (depending on scope) and stops.
- `/spec-impl <NN-name>` — implements an **approved** spec on its own `spec-NN-slug` branch, one plan step at a time, pausing for diff review; it never commits on its own.
- `spec-verifier` (`.opencode/agents/spec-verifier.md`) — subagent that checks **Criterios de aceptación** against code + Playwright and flips `- [ ]` → `- [x]`.
- Specs are historical records: never rewrite an implemented spec's scope; only the verifier marks criteria.
- `generating-commits` — Conventional Commits, ≤72 chars, with a "why" explanation.

### Skills (`.agents/skills/`, tracked in `skills-lock.json`)

- `spec`, `spec-impl` — from `klerith/fernando-skills` (spec workflow above).
- `supabase` — from `supabase/agent-skills`; **required** for any Supabase task (auth, RLS, storage, functions, migrations, logs). It also warns that Supabase changes fast: check `https://supabase.com/changelog.md` for breaking changes before implementing.
- `supabase-postgres-best-practices` — from `supabase/agent-skills`; **required before writing/changing anything in Postgres** (schema design, columns, indexes, RLS, triggers, functions, queues, vector search, performance debugging).
- Skill sources and hashes live in `skills-lock.json`; install/refresh with the `skill-manager` skill (publishes to the shared `DarwoftSkills` Azure DevOps repo).

## Supabase

- Remote project `nbxyedmbcaotimfwdskx` (`https://nbxyedmbcaotimfwdskx.supabase.co`), accessed through the **Supabase MCP server** (global `~/.config/opencode/opencode.json`, features: docs, account, database, debugging, development, functions, branching). The MCP runs SQL against the **remote** DB — changes are live, not local.
- **The Supabase CLI is NOT installed** (`supabase` not on PATH) and there is no local stack: do not assume `supabase start`, `supabase db diff` or `supabase link` work. The remote project is the source of truth for the schema.
- **Every schema change must land as a migration file in the repo.** `supabase/migrations/<version>_<name>.sql` is the committed record of each DB change, in the same order it was applied. Rules:
  - Apply the change to the remote DB with MCP `apply_migration` **and** add the identical SQL as a file in `supabase/migrations/` in the same change. Never apply DDL to the remote project without the matching file.
  - Name the file `<version>_<name>.sql`, where `<version>` is the `YYYYMMDDHHMMSS` timestamp returned by `list_migrations` for that migration (e.g. `20261030190834_create_daycares.sql`) and `<name>` is the migration name (`create_daycares`).
  - One migration per table/logic change: keep each file independently reviewable and verifiable.
  - The file is the SQL exactly as applied — same comments, same statements. Do not edit a file after it has been applied; add a new migration instead.
  - Migrations are only a record: they are applied via MCP, not by the CLI. Data-only changes (seeds) are **not** migrations — they run via `execute_sql` and are not committed as files.
- `supabase-js` / `@supabase/ssr` are **not yet** dependencies of this app; the UI runs on mock data in `data/`. Add them only when a spec covers it.
- `.env` holds `SUPABASE_DB_PASSWORD` (gitignored); `.env.template` is the committed placeholder (`.gitignore` has `!.env.template`). Never commit `.env` or any key.
- **Schema reference**: `../07-DB-Schema/opendaycare-database-schema.md` (opencode reference `docs`). It is the source of truth for tables/columns/enums — everything persisted is in **English** (enums, tags, codes); user-visible labels are translated in the UI layer (Spanish).
- Before writing any SQL/schema: enable **RLS on every exposed table**, match policies to the real access model, and never use `user_metadata` for authorization (use `app_metadata`). Granting `anon`/`authenticated` access requires explicit `GRANT` + RLS (Data API exposure ≠ RLS).
- Load the `supabase` skill for any Supabase task and `supabase-postgres-best-practices` before writing SQL, migrations, indexes or RLS policies.

## MCPs & git

- Playwright: screenshots and logs must go to `.playwright-mcp/` (gitignored).
- Context7: use it for current framework docs.
- Supabase MCP: see the **Supabase** section above (remote project, no local stack).
- `opencode.json` is local config (gitignored) — do not commit it.
- Feature branches are `spec-NN-slug` and land as merge commits from `fdmarti/*`; keep commits scoped to one spec.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
