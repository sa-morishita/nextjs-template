# Project Structure and Architecture (Revised)

## Directory Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # Authentication routes
│   │   ├── (protected)/   # Protected routes requiring authentication
│   │   │   └── dashboard/
│   │   │       ├── diary/     # Diary feature
│   │   │       ├── mypage/    # User profile
│   │   │       └── tasks/     # Task management
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
│   │   ├── actions/       # Server actions (imports from usecases)
│   │   ├── constants/     # Application constants
│   │   ├── email/         # React Email templates and provider
│   │   ├── mutations/     # Data mutation logic
│   │   ├── queries/       # Data fetching logic
│   │   ├── schemas/       # Zod schemas for validation
│   │   ├── services/      # Business logic and external services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── usecases/      # Application business logic
│   │   ├── utils/         # Utility functions
│   │   └── domain/        # Domain models and business rules
│   │       ├── auth.ts
│   │       ├── upload.ts
│   │       ├── diary/
│   │       └── todos/
│   ├── services/          # Business services layer
│   │   ├── auth/          # Authentication services (Better Auth)
│   │   │   ├── index.ts   # Main auth instance
│   │   │   ├── config.ts  # Auth configuration
│   │   │   ├── client.ts  # Client-side hooks
│   │   │   └── service.ts # Server-side services
│   │   ├── diary/         # Diary management services
│   │   ├── file-storage/  # File storage abstraction
│   │   │   ├── types.ts
│   │   │   ├── factory.ts
│   │   │   └── adapters/
│   │   │       ├── supabase.ts
│   │   │       └── local.ts
│   │   └── todo/          # Todo management services
│   ├── infrastructure/    # External integrations and adapters
│   ├── db/
│   │   ├── client.ts      # Database client setup
│   │   └── schema/        # Drizzle database schema
│   │       ├── index.ts   # Schema exports
│   │       ├── auth.ts    # Authentication tables
│   │       ├── diaries.ts # Diary tables
│   │       └── todos.ts   # Todo tables
│   ├── test/              # Test utilities and setup
│   │   ├── setup.ts       # Unit test setup
│   │   ├── integration-setup.ts # Integration test setup
│   │   ├── factories/     # Test data factories
│   │   ├── mocks/         # Test mocks
│   │   └── utils/         # Test utilities
│   ├── middleware.ts      # Next.js middleware (Better Auth)
│   ├── instrumentation.ts # Sentry instrumentation
│   └── instrumentation-client.ts # Client-side instrumentation
├── supabase/              # Supabase Local configuration
│   └── config.toml        # Local development settings
├── drizzle/               # Database migrations
├── .github/               # GitHub Actions workflows
├── .claude/               # Claude-specific configurations
├── biome.json            # Biome linting/formatting configuration
├── tsconfig.json         # TypeScript configuration
├── lefthook.yml          # Git hooks configuration
├── package.json          # Dependencies and scripts
├── vitest.config.mts     # Unit test configuration
├── vitest.integration.config.mts # Integration test configuration
├── drizzle.config.ts     # Drizzle ORM configuration
└── CLAUDE.md             # AI development guidelines
```

## Architectural Layers

### 1. Presentation Layer (`src/app/`, `src/components/`)
- Next.js App Router pages
- React components (Server & Client)
- UI/UX logic

### 2. Application Layer (`src/lib/actions/`, `src/lib/usecases/`)
- Server actions
- Use case orchestration
- Application flow control

### 3. Domain Layer (`src/lib/domain/`)
- Business rules and validations
- Domain models
- Pure business logic

### 4. Service Layer (`src/services/`, `src/lib/services/`)
- External service integrations
- Business service implementations
- Infrastructure abstractions

### 5. Data Layer (`src/lib/queries/`, `src/lib/mutations/`)
- Database operations
- Data access logic
- Cache management

### 6. Infrastructure Layer (`src/infrastructure/`, `src/db/`)
- External system integrations
- Database configuration
- Third-party adapters

## Data Flow Architecture

### Standard Flow
```
User Interaction
    ↓
Server Action (src/lib/actions/)
    ↓
Use Case (src/lib/usecases/)
    ↓
Domain Validation (src/lib/domain/)
    ↓
Service/Query/Mutation (src/lib/services/, queries/, mutations/)
    ↓
Database (src/db/)
    ↓
Cache Invalidation
    ↓
UI Update
```

### Error Handling Flow
```
Action/UseCase/Query/Mutation throws Error
    ↓
next-safe-action catches via handleServerError
    ↓
Error translated to user-friendly message
    ↓
Client receives formatted error response
```

**IMPORTANT**: No try-catch blocks in actions, usecases, queries, or mutations. Let errors propagate to next-safe-action's error handler.

## Key Architectural Patterns

### Container/Presentational Pattern
- **Location**: `src/components/_containers/`
- **Structure**:
  - `index.tsx` - Exports
  - `container.tsx` - Data fetching (Server Component)
  - `presentational.tsx` - UI rendering (Client Component)

### Server Components First
- Default to Server Components
- Use `'use client'` only when needed:
  - Interactive elements
  - Browser APIs
  - Client state
- Wrap client components in Suspense

### Domain-Driven Design
- Business logic in domain layer
- Infrastructure-agnostic domain models
- Clear bounded contexts (auth, diary, todos)

### Service Abstraction
- File storage abstraction with adapters
- Authentication service layer
- Email service abstraction

## Testing Structure

### Test Types
1. **Unit Tests** (`*.test.ts`, `*.test.tsx`)
   - Component testing
   - Utility function testing
   - Uses jsdom environment

2. **Integration Tests** (`*.integration.test.ts`)
   - Database operations
   - Service integration
   - Uses PGLite in-memory DB

3. **Storage Tests** (`*.storage.test.ts`)
   - File system operations
   - Storage adapter testing
   - Mock file system

### Test Organization
```
__tests__/
├── unit/
│   ├── components/
│   └── utils/
├── integration/
│   ├── mutations/
│   ├── queries/
│   └── usecases/
└── storage/
    └── services/
```

## Caching Strategy

### Cache Tags
- **User-specific**: `todos-user-${userId}`, `diaries-user-${userId}`
- **Resource-specific**: `todo-${id}`, `diary-${id}`
- **Global**: `todos-all`, `diaries-all`
- **Auth**: `users-all`

### Invalidation Rules
- **Create**: Invalidate user and global caches
- **Update**: Invalidate specific resource and user cache
- **Delete**: Invalidate resource, user, and global caches

## Security Architecture

### Authentication
- Better Auth with Supabase PostgreSQL
- Email verification required
- Session-based authentication
- Social login support (LINE)

### Authorization
- Middleware-based route protection
- Row-level security in database
- User context validation in services

### Data Protection
- Input validation with Zod
- SQL injection prevention (Drizzle)
- XSS protection (React)
- CSRF protection (Better Auth)

## Performance Optimizations

### Next.js 15 Features
- Streaming SSR with Suspense
- Partial prerendering
- Server Components by default
- Optimized client bundles

### Image Optimization
- Next.js Image component
- WebP format conversion
- Lazy loading
- Responsive images

### Database Performance
- Connection pooling
- Indexed queries
- Efficient pagination
- Query optimization

## Development Workflow

### Commands
```bash
# Code quality
pnpm biome check --write .
pnpm typecheck
pnpm check:all

# Testing
pnpm test:unit
pnpm test:integration
pnpm test:coverage

# Database
pnpm db:migrate:dev
```

### Git Hooks (Lefthook)
- **Pre-commit**: Biome, TypeScript, tests
- **Pre-push**: Security audit

### Environment Management
- Schema validation with @t3-oss/env-nextjs
- Type-safe environment variables
- Separate configs for dev/prod