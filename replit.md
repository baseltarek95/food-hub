# Food Hub

Egyptian home cooking with recipe discovery, guided cooking, meal planning, grocery lists and draft requests for home-cook lessons.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/food-hub run dev` — managed frontend workflow; requires its injected PORT and BASE_PATH
- `NODE_ENV=development pnpm --filter @workspace/api-server run seed:food` — explicit, idempotent development sample seed; never run against production
- `pnpm --filter @workspace/api-server run catalog:export` — export reviewed recipe-only production content without database access
- `pnpm --filter @workspace/api-server run catalog:verify -- <published-origin>` — read-only published catalog, photo and credit verification
- `pnpm --filter @workspace/api-server run test:catalog` — release and fail-closed verification checks
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/food-hub/` — working React app; pages, shared UI and server-backed workspace helpers.
- `artifacts/mockup-sandbox/src/components/mockups/food-hub/` — approved 19-screen design references; preserve them.
- `lib/api-spec/openapi.yaml` — API source of truth; regenerate clients after changes.
- `lib/db/src/schema/` — catalog, guest/account workspaces and lesson draft tables.
- `artifacts/api-server/src/routes/food.ts` — API input validation, guest isolation, persistence and lesson draft pricing.
- `artifacts/api-server/src/scripts/seed-food.ts` — curated example recipes and explicitly sample cooks/courses.
- `artifacts/food-hub/public/images/food-hub/SOURCES.md` — licensed photo sources, authors, license terms and checksums.
- `artifacts/api-server/CATALOG-LAUNCH.md` — explicit production recipe import and launch verification procedure.

## Architecture decisions

- Clerk manages real accounts. Account workspace ownership comes only from the verified server session; never accept owner IDs from the browser. Guests can still use a browser-only workspace.
- Import guest work only after explicit signed-in confirmation. Imports combine lists transactionally; ambiguous cook drafts, vouchers, lesson times or size limits must leave both workspaces unchanged with a clear error. After import, clear the guest cookie; never expose account data to the next guest or account on a shared device.
- Sample cooks are not verified or bookable. Lesson requests are saved drafts only, not messages, reservations or paid bookings.
- Ingredient matching uses deterministic ingredient overlap; AI is not connected.
- Keep unavailable payments, grocery delivery, video calls, reviews, tips and verification explicit. Never display a simulated external success.
- Guest cookies are HttpOnly, Secure, same-site and stored hashed in PostgreSQL. Losing the cookie loses access to that workspace; do not expose its identifier in UI/logs.

## Product

The working app follows all 19 approved screen destinations. Recipe saving, serving adjustment, step timers, supported-browser voice controls and wake locks, meal plans, aggregated grocery lists, cart editing, sample vouchers, course practice checklists, guest nicknames, cook application drafts and lesson draft creation/deletion persist through the API where appropriate.

Services still to connect: verified instructors, payment processing, grocery stores and fulfilment, embedded creator/course videos and live lessons, actual AI suggestions.

## User preferences

Preserve the approved warm cream-and-green photo-first design and use actual Egyptian food photographs rather than illustrated food placeholders.

## Gotchas

- GET `/api/food/workspace` must finish before dependent guest writes or summary loading; it establishes the guest cookie.
- Development needs the additive `owner_id` / unique owner index schema change (`pnpm --filter @workspace/db run push`). Apply the same additive schema before running the updated API in another environment.
- Clerk's proxy must stay before body parsing and its session middleware before API routes. Auth changes must remount all account state, not reuse another identity's query cache or forms.
- PATCH only changed workspace sections, await success, and update workspace and summary caches. Do not overwrite the whole workspace from stale UI state.
- Aggregate grocery ingredients only when BOTH name and unit match.
- Home visits are unavailable until service-area and safety verification exist.
- The catalog seed is a development command, not a production startup migration. Plan a deliberate catalog import for production.
- Public food photos are licensed CC BY-SA photographs of Egyptian dishes. Keep the linked photo credits and ShareAlike terms with the images; do not restore uncleared design-reference photos.
- Development samples do not establish a published catalog. Import the reviewed recipe-only release deliberately and verify the actual published environment before recommending public launch.
- `dom.iterable` is required for generated fetch header helpers; Orval React Query generation is pinned to v5.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
