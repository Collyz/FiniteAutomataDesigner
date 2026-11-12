# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

The repo root is just `LICENSE`/`README.md`; the actual Next.js app lives in `finite-automata-designer/`. Run all commands below from that subdirectory.

## What this is

A web app for building and simulating DFAs and NFAs (labeled DFSM/NDFSM in the UI) on an interactive HTML5 Canvas, with user auth and save/load of designs. See `README.md` for the full feature list.

## Commands

All run from `finite-automata-designer/`:

- `npm run dev` — start the Next.js dev server (Turbopack). Does **not** rebuild the canvas scripts — run a `build:*` command first if you touched `public/scripts/**`.
- `npm run dev:all` — rebuilds both canvas bundles, then starts dev server.
- `npm run dev:dfsm` / `npm run dev:ndfsm` — rebuild only the DFSM or NDFSM canvas bundle, then start dev server.
- `npm run build:dfsm` / `npm run build:ndfsm` / `npm run build:canvas` (both) — compile the standalone canvas TypeScript into `public/scripts/{dfsm,ndfsm}/*Canvas.js` via Rollup. Must be re-run any time files under `public/scripts/**` change — the output `.js` files are checked into `public/` and are what actually gets served.
- `npm run build` — standard Next.js production build (app code only).
- `npm run build:prod` — full production build: canvas bundles + Next.js build.
- `npm run lint` — `eslint .` using the flat config in `eslint.config.mjs` (`eslint-config-next/core-web-vitals` + `/typescript`). `public/scripts/**` and the rollup configs are currently ignored.

There is no test suite configured in this repo.

## Architecture: two parallel TypeScript worlds

This codebase has an unusual split that is essential to understand before editing:

1. **`src/`** — the Next.js App Router application (React components, pages, Supabase/DB access, auth). Built normally by Next's own toolchain.
2. **`public/scripts/`** — standalone TypeScript for the canvas editor itself (state/circle drawing, arrow drawing, hit-detection, drag-and-drop, FA simulation wiring, import/export). This is compiled **separately** by Rollup (`rollup.dfsm.config.js` / `rollup.ndfsm.config.js`) into IIFE bundles (`public/scripts/dfsm/dfsmCanvas.js`, `public/scripts/ndfsm/ndfsmCanvas.js`), which are loaded into the page as classic `<script>` tags via `next/script` (see `AutomataEditor.tsx`), not imported as ES modules by React.

Despite living outside `src/`, canvas scripts import shared logic from `src/lib/**` using the `@/*` path alias (e.g. `dfsmCanvas.ts` imports `dfsmAlgo`/`dfsmTransitionSymbols` from `src/lib/dfsm/` and `serializeFA`/`deserializeFA` from `src/lib/shared/`). Rollup resolves these the same way `tsconfig.json`'s `paths` does.

**Shared vs. per-automaton canvas code:**
- `public/scripts/canvasUtil/fsmCanvas.ts` holds everything common to both the DFSM and NDFSM canvases (mounting, drawing loop, drag/hit-detection, import/export UI wiring). It's parameterized by an `FsmCanvasConfig` object.
- `public/scripts/dfsm/dfsmCanvas.ts` and `public/scripts/ndfsm/ndfsmCanvas.ts` are the two entry points — each supplies its `FsmCanvasConfig` (alphabet get/set, transition validator, run algorithm, importer) and is the actual Rollup `input`.
- `public/scripts/Shapes/` holds the shape primitives (`Circle`, `Arrow`, `SelfArrow`, `EntryArrow`, `TemporaryArrow`) shared by both.
- `public/scripts/exporting/` handles SVG/LaTeX export.

**React ↔ canvas-script bridge** (since the canvas script isn't a React module):
- The canvas script attaches functions to `window` (typed in `src/types/global.d.ts`): `loadDFSMIntoCanvas`/`loadNDFSMIntoCanvas`, `exportDFSM`/`exportNDFSM`, `resetDFSMEditor`/`resetNDFSMEditor`, `getDFSMAlphabet`/`getNDFSMAlphabet`.
- `src/app/components/editor/api/automataApi.ts` wraps these `window.*` calls behind a uniform `automataApi.DFSM` / `automataApi.NDFSM` object, keyed by the `type` prop threaded through `AutomataEditor.tsx`.
- The canvas script also dispatches `CustomEvent`s on `window` that React listens for: `${type}AlphabetUpdated` (e.g. `dfsmAlphabetUpdated`) to sync alphabet state, and a shared toast event (`SHOW_TOAST_EVENT`, see `src/lib/toast.ts`) so canvas-side code can trigger the same toast UI as React code (`showToast()` helper).
- Because the script loads asynchronously (`next/script` `strategy="afterInteractive"`), `AutomataEditor.tsx` guards against a load race: if automaton data arrives from the DB before `window.loadDFSMIntoCanvas` exists, it's buffered in a ref and flushed from the `<Script onReady>` callback.

**When editing automaton behavior**, decide which world it belongs in:
- Simulation/validation logic, transition symbol rules → `src/lib/dfsm/` or `src/lib/ndfsm/` (plain TS, importable by both the canvas scripts and, if ever needed, server code).
- Drawing, dragging, hit-detection, canvas event handling → `public/scripts/canvasUtil/` or `public/scripts/Shapes/`.
- Serialization format shared by save/load and import/export → `src/lib/shared/serializer/` and `src/lib/shared/deserializer/` (`SerializedFA`/`SerializedCircle`/`SerializedArrow`/`SerializedEntryArrow` types in `src/lib/shared/types.ts`).
- **After any change under `public/scripts/**`, re-run the matching `build:dfsm`/`build:ndfsm`/`build:canvas` command** — the dev server does not watch/rebuild these automatically, and the checked-in `.js` output is what the browser loads.

## Data / auth

- **Supabase** (`src/lib/supabase/{client,server,middleware}.ts`) is the sole DB/auth backend — Postgres storage for saved automata plus user auth (email/password and Google OAuth via `supabase.auth.signInWithOAuth`, see `src/lib/actions.ts`). `src/proxy.ts` (Next 16's renamed middleware) calls `updateSession` from `src/lib/supabase/middleware.ts` on every non-static route to refresh the session and redirect logged-out users away from `/profile` and `/projects`.
- `src/lib/automata/queries.ts` / `mutations.ts` are the data-access layer for saved automata (fetch/save/update), used by `AutomataEditor.tsx` and the projects pages.
- The DB stores the legacy type names `"DFA"` / `"NFA"`; the UI/editor uses `"DFSM"` / `"NDFSM"`. The mapping happens at the save boundary in `AutomataEditor.tsx` (`handleSaveAsNew`) — don't conflate the two naming schemes.
- Required env vars are documented in `.env.template` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `SUPABASE_SECRET_KEY` and `DATABASE_URL` are for local tooling only). For local development, run `npx supabase start` (needs Docker) and copy the values from `npx supabase status`.
- The project previously used NextAuth + AWS DynamoDB; both were fully replaced by Supabase and their dependencies removed. Ignore any leftover references in `.rollup.cache/` (stale build cache).

## Path alias

`@/*` maps to `src/*` (`tsconfig.json`), used throughout both `src/` and the `public/scripts/` canvas code.
