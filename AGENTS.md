# AGENTS.md

This file provides guidance when working with code in this repository.

## MCP Usage Guidelines

### Brave Search MCP

**IMPORTANT**: Brave Search MCP has API rate limits. When using Brave Search tools (`mcp__brave-search__*`), execute them **sequentially** (one at a time) to avoid rate limit errors. Do NOT run multiple Brave Search tools in parallel.

- ✅ **Correct**: Execute search queries one after another
- ❌ **Incorrect**: Running multiple `mcp__brave-search__brave_web_search` calls simultaneously

## Development Commands

### Code Quality & Validation

- `pnpm biome check --write .` - Run Biome check with auto-fix (recommended for AI code updates)
- `pnpm typecheck` - TypeScript type checking
- `pnpm check:all` - Run all checks (Biome + TypeScript)

### Database Commands

- `pnpm db:migrate:dev` - Apply database migrations in development environment

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

- **Framework**: Next.js 15.3 with App Router, React 19 Server Components first
- **Language**: TypeScript strict mode, path alias `@/*` → `./src/*`
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI primitives with shadcn/ui pattern
- **Database**: Supabase Local + Drizzle ORM
- **Authentication**: Better Auth with email/password
- **Forms**: React Hook Form + Zod + next-safe-action
- **State**: Zustand for client-side state
- **Quality**: Biome (formatting/linting), Lefthook (git hooks)
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Monitoring**: Sentry for error tracking
- **Environment**: @t3-oss/env-nextjs for validation

### Project Structure

- `app/` - Next.js App Router pages and layouts
  - `(auth)/` - Authentication routes (login, signup, password reset)
  - `(protected)/` - Protected routes requiring authentication
  - `api/auth/[...all]/` - Better Auth API routes
- `components/` - Reusable UI components
  - `auth/` - Authentication-specific components
  - `dashboard/` - Dashboard layout components
  - `ui/` - Base UI components (shadcn/ui pattern)
- `db/` - Database configuration
  - `schema/` - Drizzle ORM schemas (auth, todos, diaries)
- `lib/` - Core application logic:
  - `actions/` - Server actions (imports from usecases)
  - `domain/` - Domain models and business rules
  - `mutations/` - Data mutation logic
  - `queries/` - Data fetching logic
  - `schemas/` - Zod validation schemas
  - `services/` - Business services (auth, email, image upload)
  - `supabase/` - Supabase client and storage utilities
  - `usecases/` - Application business logic
  - `utils/` - Utility functions and helpers
- `test/` - Test utilities and helpers (Vitest)
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
