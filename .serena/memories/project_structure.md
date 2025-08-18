# Project Structure and Architecture

## Directory Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── sample/
│   │   │   ├── (auth)/    # Authentication routes
│   │   │   └── (protected)/ # Protected routes requiring authentication
│   │   ├── api/           # API routes
│   │   ├── layout.tsx     # Root layout
│   │   ├── error.tsx      # Error boundary
│   │   ├── loading.tsx    # Loading UI
│   │   ├── not-found.tsx  # 404 page
│   │   ├── global-error.tsx # Global error boundary
│   │   └── env.mjs        # Environment variable validation
│   ├── components/
│   │   ├── ui/            # Base UI components (shadcn/ui pattern)
│   │   ├── form/          # Form-specific components
│   │   └── _containers/   # Container components (data + UI)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Core utilities and integrations
│   │   ├── actions/       # Server actions (imports from mutations/queries/services)
│   │   ├── auth/          # Better Auth configuration and client
│   │   ├── constants/     # Application constants
│   │   ├── email/         # React Email templates and provider
│   │   ├── mutations/     # Data mutation logic
│   │   ├── queries/       # Data fetching logic
│   │   ├── schemas/       # Zod schemas for validation
│   │   ├── services/      # Business logic and external services
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── db/
│   │   └── schema/        # Drizzle database schema
│   │       ├── index.ts   # Schema exports
│   │       ├── auth.ts    # Authentication tables
│   │       └── todos.ts   # Application tables
│   ├── test/              # Test utilities and setup
│   │   ├── setup.ts       # Unit test setup
│   │   ├── integration-setup.ts # Integration test setup
│   │   └── mocks/         # Test mocks
│   ├── middleware.ts      # Next.js middleware (Better Auth)
│   └── instrumentation.ts # Sentry instrumentation
├── supabase/              # Supabase Local configuration
├── .github/               # GitHub Actions workflows
├── biome.json            # Biome linting/formatting configuration
├── tsconfig.json         # TypeScript configuration
├── lefthook.yml          # Git hooks configuration
├── package.json          # Dependencies and scripts
├── vitest.config.mts     # Unit test configuration
├── vitest.integration.config.mts # Integration test configuration
├── drizzle.config.ts     # Drizzle ORM configuration
└── CLAUDE.md             # AI development guidelines
```

## Architectural Patterns

### Container/Presentational Pattern
Components are organized to separate concerns:
- **Container Components**: Handle data fetching (Server Components)
- **Presentational Components**: Pure UI rendering with props
- **Directory Structure**: `_containers/` folders with:
  - `index.tsx` - Exports the container
  - `container.tsx` - Data fetching logic
  - `presentational.tsx` - UI rendering logic

### Data Flow Architecture
```
User Interaction → Server Action → Mutation/Query/Service → Database
                     ↓
                 Cache Invalidation → UI Update
```

Server actions follow this flow:
`actions/` → `mutations/`/`queries/`/`services/`

### Caching Strategy
- **Cache Tags**:
  - User-specific: `todos-user-${userId}`
  - Resource-specific: `todo-${id}`
  - Global: `todos-all`
  - User auth: `users-all`
- **Invalidation Strategy**:
  - Create: Invalidate user and global lists
  - Update: Invalidate specific resource and user list
  - Delete: Invalidate resource, user list, and global list

### Testing Architecture
- **Unit Tests**: Component-focused with React Testing Library
- **Integration Tests**: Database-focused with PGLite and Drizzle
- **Test Isolation**: Each test gets fresh database instance
- **Mock Strategy**: Mock at query/mutation level, not database level

## Key Configuration Files

### Code Quality
- `biome.json` - Linting, formatting, and code style rules
- `lefthook.yml` - Git hooks for pre-commit/pre-push validation
- `tsconfig.json` - TypeScript strict mode configuration

### Testing
- `vitest.config.mts` - Unit tests with jsdom environment
- `vitest.integration.config.mts` - Integration tests with Node environment
- `src/test/setup.ts` - Global test setup and mocks

### Database
- `drizzle.config.ts` - Drizzle ORM configuration
- `src/db/schema/` - Database table definitions
- Environment-specific connection settings (local vs production)

### Build & Deploy
- `next.config.ts` - Next.js configuration with Sentry
- `.github/workflows/` - CI/CD automation
- Environment variable validation in `src/app/env.mjs`

## Environment Configuration

### Local Development
- Supabase Local for database (port 54322)
- HTTP-only connections (no SSL)
- Direct database connection (no pooling)
- Hot reload with Turbopack

### Production
- Supabase Cloud with Connection Pooler (port 6543)
- HTTPS required for all connections
- SSL required for database
- Prepared statements disabled for pooler compatibility

## Special Files and Conventions

### Next.js App Router Special Files
- `layout.tsx` - Shared layout for route segments
- `page.tsx` - Route page component
- `error.tsx` - Error boundary (Client Component)
- `not-found.tsx` - Custom 404 page
- `loading.tsx` - Loading UI during page transitions
- `route.ts` - API route handlers

### Better Auth Integration
- Server-side session management
- Email verification flow
- Password reset with React Email templates
- Database-backed sessions with PostgreSQL