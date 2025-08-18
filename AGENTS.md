# AGENTS.md

This file provides guidance when working with code in this repository.

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
- Test naming: `*.test.ts(x)` (unit), `*.integration.test.ts`, `*.storage.test.ts`

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
- **Testing**: Vitest + React Testing Library
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
- `test/` - Test utilities and helpers

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