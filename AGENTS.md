<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Open Daycare — Next.js 16.4.3 (App Router) + React 19.3 + TypeScript strict + Tailwind v4. Package manager is **npm** (commit `package-lock.json`).

- The product spec is the UI mockups in `references/pantallas/*.dc.html` (daycare app in Spanish: login, feeds, niños, avisos, resumen del día…). Before building a screen, read its `.dc.html` mockup; polished renders are in `references/screenshots/`.
- Approved specs live in `specs/` (`NN-name.md`, plus `specs/.spec-config.yml` with `AutoCreateBranch` for `/spec-impl`). The create-next-app starter page is gone: `/` is the feed (spec 01).
- `references/pantallas/support.js` is GENERATED ("do not edit"); its `dc-runtime` source is not in this repo, so never modify or rebuild it here.
- Path alias: `@/*` → repo root.

## Structure (Nuxt-style folders)

- `app/` — routing/layouts only (Next.js convention, keep intact): route group `app/(app)/` holds the shared shell (`layout.tsx` = `<Sidebar/>` + scrollable `<main>`) and its pages.
- `components/<feature>/` — UI split per feature (`feed/`, `layout/`), cross-cutting code in `components/common/<concern>/` (e.g. `icons/Icons.tsx`). File names are **PascalCase**.
- `data/<feature>/` — mock data for that feature (`data/feed/mock-posts.ts`). No Next.js special meaning; routing lives only in `app/`.
- Never put feature UI inside `app/` pages; import via the `@/*` alias.

## Commands

- `npm run dev` — dev server (Turbopack; also regenerates the `nextjs-agent-rules` block above)
- `npm run lint` — ESLint flat config (`eslint-config-next`)
- `npm run build` — production build
- No test runner and no typecheck script exist. If needed: `npx tsc --noEmit`

## next.config.ts gotchas

- `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback` are enabled — check the bundled docs before assuming default caching/rendering behavior.
- Tailwind v4 is wired via the Turbopack loader rule (`@tailwindcss/turbopack`). Styling is CSS-first (`@theme` in `app/globals.css`); there is no `tailwind.config.js`.

## Skills & workflow (`.agents/skills/`)

- `/spec <feature>` — spec-driven design; specs are saved to `specs/` as `NN-name.md` with an `Estado:` header (must be "Aprovado" before implementing).
- `/spec-impl <NN-name>` — implements an approved spec on its own `spec-NN-slug` branch; branch is created automatically unless `specs/.spec-config.yml` sets `AutoCreateBranch: false`.
- `spec-verifier` (`.opencode/agents/spec-verifier.md`) — subagent that reviews a spec's **Criterios de aceptación**: verifies statically, consults Context7 for Next.js conventions, uses Playwright MCP for screens, and flips `- [ ]` → `- [x]` (fixing code when needed).
- `generating-commits` — Conventional Commits, ≤72 chars, with a "why" explanation.

## MCPs

- Playwright: capturas y logs de playwright deben guardarse en `.playwright-mcp/` (ya está en `.gitignore`).
- Context7: usar para traer la documentación actualizada del framework.
- `opencode.json` es configuración local (está en `.gitignore`), no commitearla.

## Code rules

- Always use clean code, all name must be in english. (functions, variables, etc)
- Code in English (functions, variables, components); visible strings in Spanish (mockup copy).
- Specs are historical records: never edit an implemented spec's scope; criteria are marked by the verifier.

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
