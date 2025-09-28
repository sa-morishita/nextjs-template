# Project Structure

## Root Layout
- `src/` — Primary source tree for Next.js app code, domain logic, database access, tests.
- `e2e/` — Playwright specs, plus global setup/teardown scripts.
- `drizzle/` — Generated SQL artifacts from Drizzle migrations.
- `public/` — Static assets served by Next.js.
- `.document/` — Development scripts (e.g., environment bootstrap).
- `.claude/commands/` — Claude Code slash commands.
- `.kiro/` — Spec-driven steering and specs (this directory).

## src/ Directory Breakdown
- `app/` — Next.js App Router entries.
  - `(auth)/` — Authentication flows (login, signup, password reset, verify email).
  - `(protected)/dashboard/` — Authenticated user workspace with nested segments for tasks and diary; includes error/not-found boundaries.
  - `api/auth/[...all]/` — Better Auth handler re-export for both edge/server runtime.
  - Root-level files: `layout.tsx`, `global-error.tsx`, `error.tsx`, `not-found.tsx`, `env.mjs`, `globals.css`.
- `lib/` — Domain/application logic separated by responsibility.
  - `actions/` — `next-safe-action` entrypoints tying UI to usecases.
  - `usecases/` — Business rules orchestrating queries/mutations/services.
  - `queries/` — Read operations with `unstable_cache` tagging conventions (`todos-user-${userId}`, etc.).
  - `mutations/` — Write operations using Drizzle ORM.
  - `services/` — External integrations (auth, email, storage).
  - `storage/` — Abstractions for MinIO/R2.
  - `domain/` — Domain models and shared invariants.
  - `schemas/` — Zod validation schemas.
  - `utils/` — Shared helpers including `logger`.
  - `types/`, `constants/` — Shared typings/config.
- `components/` — Presentation layer.
  - `ui/` — shadcn/ui primitives adapted to project theme.
  - `auth/`, `dashboard/` — Feature-specific components.
- `hooks/` — Client hooks (Zustand stores, custom React hooks).
- `db/` — Database bindings: `schema/` for Drizzle definitions (`todos`, `diaries`, `auth`), `client.ts`, `seed.ts`.
- `test/` — Testing utilities, factories, helpers, mocks for Vitest.

## Naming & Patterns
- Directories use kebab-case (`(protected)/dashboard/(home)` etc.).
- Functions handling persistence follow verbs `get*/create*/update*/delete*`.
- Pure functions favor `map*/validate*/convert*/calculate*` prefixes.
- Files aligning with server/client split: server components by default; add `"use client"` only where interactivity demands.
- Container/Presentational convention: `_containers/` housing `container.tsx` (data) + `presentational.tsx` (UI) when splits matter.

## Imports & Aliases
- Path alias `@/*` resolves to `./src/*`; favor absolute imports for cross-layer references.
- Server-only modules stay outside of client-marked files to avoid bundling issues.

## Error & Logging Flow
- Segment-level `error.tsx` and `not-found.tsx` files provide scoped boundaries.
- Global errors escalate to `global-error.tsx`.
- All server-side logs funnel through `@/lib/utils/logger` to respect environment gating.

## Specification Touchpoints
- Steering files in `.kiro/steering` are Always Included; update after major structural changes.
- Specs for features live in `.kiro/specs/`; ensure directory references here stay in sync with spec requirements/design/tasks.

## Maintenance Checklist
- When adding a new domain area, create matching directories under `lib`, `components`, and optionally `app/(protected)` with consistent naming.
- Document any deviations (e.g., introducing client state libraries beyond Zustand) directly in this file to guide future spec work.
- Remove or deprecate sections via `[DEPRECATED yyyy-mm-dd]` tags rather than deleting to preserve history.
