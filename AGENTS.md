# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router entry points: `page.tsx` for the landing experience, `spots/[id]/page.tsx` for details, and `api/spots/route.ts` for spot data.
- `components/` contains client UI pieces (`Map/SpotsMap.tsx`, `Spots/SpotCard.tsx`, `Search/QuickFilters.tsx`, shared `UI/`).
- `hooks/` encapsulates data fetching, geolocation, and filtering logic; `lib/distance.ts` centralizes distance math.
- `data/` keeps typed spot fixtures (`spots.json`, `calisthenics-spots.types.ts`); `public/` serves icons, manifest, and service worker.
- `scripts/` covers data and infra utilities (Turso schema/migrations, R2 uploads, image optimization); see `docs/` for MVP notes and implementation summary.

## Build, Test, and Development Commands
- `npm run dev` — start the app locally at http://localhost:3000.
- `npm run build` / `npm start` — produce and serve the production build.
- `npm run lint` — Next.js + ESLint core-web-vitals checks (run before pushing).
- `npm run db:setup` and `npm run db:migrate` — apply Turso schema/migrations when working with the database-backed flow.
- `npx tsx scripts/upload-images-to-r2.ts` — push asset images to Cloudflare R2 (requires `.env.local`).

## Coding Style & Naming Conventions
- TypeScript-first, React 19, Next.js 16 with App Router; prefer functional components and hooks.
- Two-space indentation; keep imports ordered by groups (std, third-party, local).
- PascalCase for components/files in `components/`, camelCase for hooks prefixed with `use`, TitleCase for types/interfaces in `data/`.
- Keep UI styling with Tailwind 4 utilities in `globals.css` and component-level classes; avoid inline magic numbers—extract small helpers when logic grows.
- Favor named exports; colocate component-specific helpers in the same file unless reused elsewhere.

## Testing & Quality
- Linting is the current enforcement layer; add unit/interaction tests as you introduce new logic (React Testing Library + Vitest/RTL are good fits).
- Name test files `*.test.ts[x]` near the code they cover; focus on filtering, geolocation states, and map/list interactions when adding coverage.
- Run `npm run lint` before PRs; keep components small and client/server boundaries clear.

## Data, Database, and Environment Notes
- Static spot data lives in `data/spots.json` and feeds the `/api/spots` endpoint; real data transforms and checks sit in `scripts/check-data.ts` and related utilities.
- Database access (when enabled) uses `lib/db.ts`; requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- Cloudflare R2 uploads need `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`; see `scripts/R2_SETUP.md`.
- Store secrets in `.env.local`; avoid committing generated artifacts from `real-data/`, `out/`, or `.next/`.

## Commit & Pull Request Guidelines
- Follow conventional commits seen in history (`fix: ...`, `feat: ...`, `chore: ...`, `refactor: ...`); keep subjects imperative and scoped.
- PRs should include: concise summary, linked issue/task, screenshots or screen captures for UI changes, and notes on env/DB/R2 steps if relevant.
- State which commands you ran (`npm run lint`, build, migrations); highlight any breaking changes or manual follow-up required.
