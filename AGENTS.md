# Claude Code Spec-Driven Development

Kiro-style Spec Driven Development implementation using claude code slash commands, hooks and agents.

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`
- Commands: `.claude/commands/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

## Development Guidelines

- Think in English, but generate responses in Japanese

## Workflow

### Phase 0: Steering (Optional)

`/kiro:steering` - Create/update steering documents
`/kiro:steering-custom` - Create custom steering for specialized contexts

Note: Optional for new features or small additions. You can proceed directly to spec-init.

### Phase 1: Specification Creation

1. `/kiro:spec-init [detailed description]` - Initialize spec with detailed project description
2. `/kiro:spec-requirements [feature]` - Generate requirements document
3. `/kiro:spec-design-ui-first [feature]` - Interactive: "Have you reviewed requirements.md? [y/N]"
4. `/kiro:spec-tasks-vertical [feature]` - Interactive: Confirms both requirements and design review

### Phase 2: Progress Tracking

`/kiro:spec-status [feature]` - Check current progress and phases

## Development Rules

1. **Consider steering**: Run `/kiro:steering` before major development (optional for new features)
2. **Follow 3-phase approval workflow**: Requirements → Design → Tasks → Implementation
3. **Approval required**: Each phase requires human review (interactive prompt or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro:steering` after significant changes
7. **Check spec compliance**: Use `/kiro:spec-status` to verify alignment

## Steering Configuration

### Current Steering Files

Managed by `/kiro:steering` command. Updates here reflect command changes.

### Active Steering Files

- `product.md`: Always included - Product context and business objectives
- `tech.md`: Always included - Technology stack and architectural decisions
- `structure.md`: Always included - File organization and code patterns

### Custom Steering Files

<!-- Added by /kiro:steering-custom command -->
<!-- Format:
- `filename.md`: Mode - Pattern(s) - Description
  Mode: Always|Conditional|Manual
  Pattern: File patterns for Conditional mode
-->

### Inclusion Modes

- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., "\*.test.js")
- **Manual**: Reference with `@filename.md` syntax

# AGENTS.md

This file provides guidance when working with code in this repository.

## MCP Usage Guidelines

### Brave Search MCP

**IMPORTANT**: Brave Search MCP has API rate limits. When using Brave Search tools (`mcp__brave-search__*`), execute them **sequentially** (one at a time) to avoid rate limit errors. Do NOT run multiple Brave Search tools in parallel.

- ✅ **Correct**: Execute search queries one after another
- ❌ **Incorrect**: Running multiple `mcp__brave-search__brave_web_search` calls simultaneously

## Development Environment Setup

### Initial Setup

- **PostgreSQL**: Install via Homebrew (`brew install postgresql@17`)
- **MinIO**: Install via Homebrew (`brew install minio`)
- **Auto Setup**: Run `.document/scripts/setup-development-environment.sh`
  - Creates PostgreSQL database automatically
  - Generates unique port numbers to avoid conflicts
  - Updates environment variables and next.config.ts

### Environment Variables

- **Database**: `DATABASE_URL` - PostgreSQL connection string
- **Storage (Dev)**:
  - `MINIO_ENDPOINT` / `MINIO_BUCKET` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`
  - `MINIO_PUBLIC_BASE_URL` - Public URL base (defaults to `${MINIO_ENDPOINT}/${MINIO_BUCKET}`)
  - `MINIO_PORT` / `MINIO_CONSOLE_PORT` - Auto-generated ports for scripts and manual起動
  - `MINIO_DATA_DIR` - Local data path (auto-generated)
- `USE_R2` - Toggle for switching runtime to Cloudflare R2
- **Storage (Prod)**: Cloudflare R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`)

## Development Commands

### Code Quality & Validation

- `pnpm biome check --write .` - Run Biome check with auto-fix (recommended for AI code updates)
- `pnpm typecheck` - TypeScript type checking
- `pnpm check:all` - Run all checks (Biome + TypeScript)

### Database Commands

- `pnpm db:migrate:dev` - Drop existing schema, regenerate migrations, apply them, and seed development data

**IMPORTANT**: Never execute database schema changes or migrations automatically. Always ask for user confirmation before running commands.

### Testing

- `pnpm test:unit` - Run unit tests
- `pnpm test:integration` - Run integration tests
- `pnpm test:storage` - Run storage tests
- `pnpm test:e2e` - Run E2E tests with Playwright
- `pnpm test:all` - Run all tests
- Test naming: `*.test.ts(x)` (unit), `*.integration.test.ts`, `*.storage.test.ts`, E2E tests in `e2e/specs/`

### Development Monitoring (dev3000)

When using dev3000 for development monitoring:

- **Log file location**: `/tmp/dev3000.log` (default path)
- **MCP tools**: When using dev3000 MCP tools (`mcp__dev3000__*`), specify `logPath: "/tmp/dev3000.log"` parameter
- **Custom log paths**: If dev3000 is started with custom options, adjust the logPath accordingly

## Architecture Overview

### Tech Stack & Configuration

- **Framework**: Next.js 15.5.4 with App Router, React 19 Server Components first
- **Language**: TypeScript strict mode, path alias `@/*` → `./src/*`
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI primitives with shadcn/ui pattern
- **Database**: PostgreSQL (Homebrew) + Drizzle ORM
- **Storage**: MinIO (S3互換) for development, Cloudflare R2 for production
- **Authentication**: Better Auth with email/password
- **Forms**: React Hook Form + Zod + next-safe-action
- **State**: Zustand for client-side state
- **Quality**: Biome (formatting/linting), Lefthook (git hooks)
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Monitoring**: Sentry for error tracking
- **Environment**: @t3-oss/env-nextjs for validation

### Project Structure

**Sample Code (Reference Only - Do NOT modify):**
- `app/(sample)/` - Sample route implementations
  - `(auth)/` - Authentication flow examples
  - `(protected)/dashboard/` - Protected dashboard examples
- `components/sample/` - Sample UI components
  - `auth/` - Auth component examples
  - `dashboard/` - Dashboard component examples
- `lib/sample/` - Sample business logic (layered architecture examples)
  - `actions/`, `usecases/`, `mutations/`, `queries/`, `domain/`, `schemas/`
  - **Delete when no longer needed**: `rm -rf src/app/(sample) src/components/sample src/lib/sample`

**Implementation Code (Add new features here):**
- `app/` - Next.js App Router pages and layouts
  - `(protected)/` - Protected routes requiring authentication (NEW features go here)
  - `(auth)/` - Authentication routes (can add custom auth routes here)
  - `api/auth/[...all]/` - Better Auth API routes
- `components/` - Reusable UI components
  - `ui/` - Base UI components (shadcn/ui pattern)
  - *Add feature-specific components here*
- `db/` - Database configuration
  - `schema/` - Drizzle ORM schemas (auth, todos, diaries)
- `lib/` - Core application logic (NEW features go here):
  - `actions/` - Server actions (imports from usecases)
  - `domain/` - Domain models and business rules
  - `mutations/` - Data mutation logic
  - `queries/` - Data fetching logic
  - `schemas/` - Zod validation schemas
  - `services/` - Business services (auth, email, image upload) *SHARED*
  - `storage/` - Unified storage interface (MinIO for dev, R2 for prod) *SHARED*
  - `usecases/` - Application business logic
  - `utils/` - Utility functions and helpers *SHARED*
- `src/test/` - Test utilities and helpers (Vitest)
- `e2e/` - E2E tests with Playwright
  - `specs/` - Test specifications
  - `global-setup.ts` - Global test setup
  - `global-teardown.ts` - Global test cleanup

### Architectural Patterns

#### Container/Presentational Pattern

- **Container**: Server Components that handle data fetching
- **Presentational**: UI components that receive props
- **Structure**: `_containers/` with `index.tsx`, `container.tsx`, `presentational.tsx`

#### Data Flow

`actions/` → `usecases/` → `mutations/`/`queries/`/`services/`

#### Caching Strategy

- **Tags**: `todos-user-${userId}`, `todo-${id}`, `todos-all`
- **Invalidation**: Update relevant tags after mutations
- **Memoization**: Automatic within same render

## Development Guidelines

### Template Usage Guidelines

**IMPORTANT**: This project contains sample/reference code to demonstrate best practices. When implementing new features:

#### Sample Code Locations

- `src/app/(sample)/` - Sample routes (auth flow, protected dashboard examples)
- `src/components/sample/` - Sample UI components
- `src/lib/sample/` - Sample business logic (layered architecture patterns)

#### Development Rules for Templates

1. **Reference Only**: Use sample code as pattern reference, do NOT modify or add to it
2. **New Implementation**: Place new features directly under `src/lib/`, `src/app/`, `src/components/`
3. **Route Placement**:
   ```
   src/lib/actions/feature.ts       # Business logic always in lib root
   src/app/(protected)/feature/     # Protected routes (requires auth)
   src/app/(auth)/custom-login/     # Custom auth routes
   src/app/public-feature/          # Public routes (no auth)
   ```
4. **Shared Infrastructure**: These stay in `lib/` root (NOT sample):
   - Authentication: `lib/actions/auth.ts`, `lib/usecases/auth.ts`
   - Upload: `lib/usecases/upload.ts`, `lib/domain/upload.ts`
   - Services: `lib/services/`, `lib/storage/`
   - Utilities: `lib/utils/`
5. **Cleanup**: Remove sample code when no longer needed: `rm -rf src/app/(sample) src/components/sample src/lib/sample`

### AI Assistant Guidelines

- **Application Testing**: When application testing is needed, do NOT run `pnpm dev` - instead, ask the developer to verify
  - Reason: The development server is usually already running locally, duplicate startup causes errors and delays
  - Instead: Ask the developer "Please verify the functionality in your browser"
  - Code changes are automatically applied through HMR (Hot Module Replacement)

### Coding Conventions

- **Programming**: Functional/declarative, no classes
- **Naming**:
  - Directories: lowercase-with-dashes
  - Functions: `get*`, `create*`, `update*`, `delete*` (async DB ops)
  - Pure functions: `convert*`, `calculate*`, `validate*`, `map*`
- **TypeScript**: Prefer interfaces, no enums (use const maps)
- **Components**: Server Components first, minimize `use client`
- **Style**: Follow existing patterns, use Tailwind CSS v4

### Error Handling

- **Server Actions**: Use next-safe-action with automatic error catching
  - Throw errors in actions/usecases/queries/mutations (no try-catch)
  - Errors are caught by `handleServerError` and translated
  - **IMPORTANT**: Do NOT use try-catch in application logic
- **Error Files**:
  - `error.tsx`: Catches errors in route segments
  - `not-found.tsx`: Custom 404 pages
  - `global-error.tsx`: Root-level error boundary
- **User Experience**: Japanese error messages via error translator

### Testing Strategy

- **Unit Tests** (`*.test.ts(x)`):
  - Place in `__tests__/` directories
  - Mock at query/mutation level
  - Container: test as async functions
  - Presentational: test with React Testing Library
- **Integration Tests** (`*.integration.test.ts`):
  - PGLite in-memory database
  - @praha/drizzle-factory for test data
  - Reset sequences in `beforeEach`
- **Storage Tests** (`*.storage.test.ts`):
  - Mock file system operations
- **E2E Tests** (`e2e/specs/*.spec.ts`):
  - Playwright browser automation
  - Real browser testing
  - Visual regression testing capabilities

## Framework Specific

### Next.js 15 Features

- **Dynamic Routes**: `params` and `searchParams` are Promises
- **URL State**: Type-safe with nuqs library
- **next-safe-action v8**:
  - Use `.inputSchema()` for validation
  - `.bind()` for non-form values
  - Navigation actions trigger `onNavigation`
- **Performance**: Wrap RSC queries in `<Suspense>`

### Authentication

- **Configuration**: Better Auth in `src/lib/services/auth/`
- **Client Hooks**: `useSession()`, `signIn()`, `signUp()`, `signOut()`
- **Server**: `getSession()` for server-side access
- **Features**: Email verification, password reset, session management
- **Database**: Better Auth tables + application tables in Drizzle schema

### Logging

- All server-side diagnostic logs must use `@/lib/utils/logger`. Only `logger.info` and `logger.warn` are output in development; in production, only `logger.error` is output.
