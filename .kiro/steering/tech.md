# Technology Stack

## Architecture Overview
- **Application Style**: Next.js 15 App Router with React 19 server components first, leaning on Suspense and `unstable_cache` for data fetching.
- **Domain Layers**: next-safe-action server actions call usecases that orchestrate queries/mutations/services; UI stays in App Router routes and presentational components.
- **Infrastructure Targets**: PostgreSQL via Drizzle ORM, MinIO for local object storage, Cloudflare R2 for production storage, Sentry for monitoring.

## Frontend
- **Framework**: Next.js 15.5.4 with Turbopack dev server, React 19, TypeScript strict mode.
- **Styling**: Tailwind CSS v4, class-variance-authority, tailwind-merge, with shadcn/ui + Radix primitives for UI components.
- **State & Forms**: Zustand for client state, React Hook Form + Zod + `@next-safe-action/adapter-react-hook-form` for validation, nuqs for URL state.
- **Routing**: App Router segments `(auth)` and `(protected)` manage access; server components default with client boundaries only where necessary.

## Backend & Services
- **Server Actions**: Implemented with `next-safe-action` v8 enabling typed inputs, automatic error handling, and navigation hooks.
- **Authentication**: Better Auth configuration in `src/lib/services/auth`, exposing `signIn`, `signUp`, `signOut`, `getSession`, and helpers.
- **Logging**: Centralized in `@/lib/utils/logger`; `info`/`warn` restricted to development, `error` available in all environments.
- **Monitoring**: `@sentry/nextjs` instrumentation via `sentry.server.config.ts` and `sentry.edge.config.ts`.

## Data & Storage
- **Database**: PostgreSQL 17 local (Homebrew), Neon pooled connections in production; schema defined with Drizzle ORM under `src/db/schema`.
- **Migrations**: `drizzle-kit` CLI (drop/generate/migrate) wrapped by package scripts.
- **Seed Data**: `tsx src/db/seed.ts` invoked during `pnpm db:migrate:dev` after migrations.
- **Object Storage**: MinIO configured through `.env.local` values; `USE_R2=true` switches to Cloudflare R2 credentials in production.

## Tooling & Quality Gates
- **Lint/Format**: Biome (`pnpm biome check --write .`) replacing ESLint/Prettier.
- **Type Safety**: `pnpm typecheck` (`tsc --noEmit`).
- **Testing**: Vitest for unit/integration/storage suites, Playwright for end-to-end; `pnpm test:all` aggregates.
- **CI/CD**: GitHub Actions workflows (`ci.yml`, `e2e.yml`, `security.yml`, etc.) and Vercel deployments.
- **Local Dev Server**: `dev3000` CLI (preferred) or `pnpm dev` fallback.

## Environment Management
- **Setup Script**: `.document/scripts/setup-development-environment.sh` provisions PostgreSQL DB, MinIO, env files, and Next config ports.
- **Primary Variables**:
  - `DATABASE_URL` for Drizzle/PostgreSQL.
  - MinIO: `MINIO_ENDPOINT`, `MINIO_BUCKET`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_PUBLIC_BASE_URL`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `MINIO_DATA_DIR`.
  - Storage toggle: `USE_R2` plus `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`.
  - Auth & Email: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET`.
  - Observability: `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`.
  - Platform: `NEXT_PUBLIC_SITE_URL`, `DRIZZLE_STUDIO_PORT`.

## Common Commands
- Dependency install: `pnpm install`
- Lint/format: `pnpm biome check --write .`
- Type check: `pnpm typecheck`
- Tests: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:storage`, `pnpm test:e2e`, `pnpm test:all`
- Coverage: `pnpm test:coverage`
- Database lifecycle (confirm destructive steps first): `pnpm db:migrate:dev`, `pnpm db:migrate:prod`
- Drizzle Studio: `pnpm db:studio`
- Dev server: `dev3000` or `pnpm dev`

## Ports & Services
- **Next.js**: 3000 default, adjustable via `dev3000 --port`.
- **MinIO API**: Auto-generated high port stored in `.env.local` (`MINIO_PORT`).
- **MinIO Console**: `MINIO_CONSOLE_PORT` (auto).
- **Drizzle Studio**: `DRIZZLE_STUDIO_PORT` from env.

## Maintenance Notes
- Always capture new third-party integrations or env requirements here when introduced.
- Update version references if major framework upgrades occur (e.g., Next.js, React, Drizzle, Better Auth).
- Document deviations from the default domain layering to keep Claude spec phases aligned.
