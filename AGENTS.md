<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Open Daycare — Next.js 16.4.3 (App Router) + React 19.3 + TypeScript strict + Tailwind v4. Package manager is **npm** (commit `package-lock.json`).

- `app/` is still the untouched create-next-app starter. The real product spec so far is the UI mockups in `references/pantallas/*.dc.html` (daycare app in Spanish: login, feeds, niños, avisos, resumen del día…). Before building a screen, read its `.dc.html` mockup; polished renders are in `references/screenshots/`.
- `references/pantallas/support.js` is GENERATED ("do not edit"); its `dc-runtime` source is not in this repo, so never modify or rebuild it here.
- Path alias: `@/*` → repo root.

## Commands

- `npm run dev` — dev server (Turbopack; also regenerates the `nextjs-agent-rules` block above)
- `npm run lint` — ESLint flat config (`eslint-config-next`)
- `npm run build` — production build
- No test runner and no typecheck script exist. If needed: `npx tsc --noEmit`

## next.config.ts gotchas

- `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback` are enabled — check the bundled docs before assuming default caching/rendering behavior.
- Tailwind v4 is wired via the Turbopack loader rule (`@tailwindcss/turbopack`). Styling is CSS-first (`@theme` in `app/globals.css`); there is no `tailwind.config.js`.

## Skills & workflow (`.agents/skills/`)

- `/spec <feature>` — spec-driven design; specs are saved to `specs/` (folder doesn't exist yet).
- `/spec-impl <NN-name>` — implements an approved spec on its own git branch.
- `generating-commits` — Conventional Commits, ≤72 chars, with a "why" explanation.

## MCPs

- Playwright: capturas y logs de playwright deben guardarse en `.playwright-mcp/` (ya está en `.gitignore`).
- Context7: usar para traer la documentación actualizada del framework.
- `opencode.json` es configuración local (está en `.gitignore`), no commitearla.
