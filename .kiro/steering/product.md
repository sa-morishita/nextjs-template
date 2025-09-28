# Product Overview

## Summary
Next.js Template is a production-ready SaaS starter that bundles authentication, content management (todo & diary samples), storage integration, and observability to accelerate shipping new features on top of a modern React 19 App Router stack.

## Core Features
- Better Auth powered email authentication: sign-up, login, password reset, email verification.
- Task and diary sample flows demonstrating CRUD with Drizzle ORM and caching via `unstable_cache`.
- Unified file storage abstraction backing MinIO in development and Cloudflare R2 in production.
- Tailwind CSS v4 + shadcn/ui based component library with Radix primitives.
- Automated quality gates: Biome linting/formatting, TypeScript type checking, Vitest + Playwright test suites, GitHub Actions pipelines.
- Observability hooks: Sentry (edge & server) instrumentation and dev3000 log stream tied to the shared logger utility.

## Target Use Cases
- Teams bootstrapping a Japanese-language SaaS dashboard that requires secure account management out of the box.
- Projects that need a reference implementation for Drizzle-based domain layering (actions → usecases → queries/mutations/services).
- Developers experimenting with Next.js 15 server component patterns and modern tooling without rebuilding infrastructure.

## Value Proposition
- Opinionated yet extensible architecture that enforces clear layering and naming conventions.
- Local developer experience scripts (`setup-development-environment`, dev3000) reduce manual configuration for PostgreSQL/MinIO.
- Ready-to-run CI/CD pipelines ensure consistency between local, preview, and production deployments.
- Built-in logging discipline through `@/lib/utils/logger` keeps environments aligned with observability requirements.

## Roadmap Signals
- Extend sample domains beyond todo/diary to showcase multi-tenant patterns.
- Harden storage service for large file uploads and R2 replication configuration.
- Expand error translation catalog for Japanese UX consistency across flows.

## Stakeholder Notes
- Product documentation and steering are considered Always Included to guide spec-driven workflows.
- Coordinate with Claude Code spec phases before implementing major features to maintain architectural integrity.
