# Code Style and Conventions

## Code Formatting (Biome Configuration)

### Basic Formatting Rules
- **Indentation**: 2 spaces (no tabs)
- **Line width**: 80 characters
- **Line endings**: LF (Unix style)
- **Quotes**: Single quotes for JavaScript/TypeScript, double quotes for JSX attributes
- **Semicolons**: Always required
- **Trailing commas**: Always use
- **Arrow functions**: Always use parentheses around parameters

### File Organization
- Lowercase with dashes for directories (`my-component`, `user-profile`)
- PascalCase for React components (`UserProfile.tsx`)
- camelCase for utility functions and variables
- UPPER_CASE for constants and environment variables

## TypeScript Conventions

### Type Definitions
- **Prefer interfaces over types** for object shapes
- **No enums** - use const maps instead
- **Strict mode enabled** - all type checking rules enforced
- **Path aliases**: Use `@/*` to map to `./src/*`

### Import Organization
```typescript
// 1. Node modules
import { useState } from 'react';
import { clsx } from 'clsx';

// 2. Internal modules (using @/ alias)
import { Button } from '@/components/ui/button';
import { getUserData } from '@/lib/queries/users';

// 3. Relative imports
import './styles.css';
```

## React/Next.js Patterns

### Component Architecture
- **Server Components First**: Minimize `use client` directives
- **Container/Presentational Pattern**: Separate data fetching from UI rendering
- **Functional Programming**: No classes, use function keyword for pure functions
- **Descriptive Naming**: Use auxiliary verbs (e.g., `getUserById`, `createUserAccount`)

### File Structure Patterns
```
components/
├── ui/                 # Base UI components (shadcn/ui pattern)
├── form/              # Form-specific components
└── _containers/       # Container components
    ├── index.tsx      # Exports container
    ├── container.tsx  # Data fetching logic
    └── presentational.tsx # UI rendering
```

### Data Flow Pattern
- Server actions flow: `actions/` → `mutations/`/`queries/`/`services/`
- Always wrap data fetching in Suspense boundaries
- Use caching with appropriate cache tags

## next-safe-action v8 Conventions
- Use `.inputSchema()` instead of `.schema()` for input validation
- Always provide metadata when using `defineMetadataSchema`
- Navigation actions trigger `onNavigation` callback (not `onSuccess`)
- Use `.bind()` for non-form values, no hidden inputs

## Database & API Patterns

### Drizzle ORM
- Schema files in `src/db/schema/`
- Use `db:push` for development, `db:generate` + `db:migrate` for production
- Always include proper indexes and constraints

### Authentication
- Better Auth integration with Supabase PostgreSQL backend
- Email verification required for new accounts
- Server-side session access with `getSession()`

## Testing Conventions

### Unit Tests
- Place in `__tests__/` directories next to components
- Use `*.test.ts` or `*.test.tsx` naming
- Mock at query/mutation level, not database level
- Test containers as async functions returning ReactElement

### Integration Tests
- Use `*.integration.test.ts` naming
- PGLite in-memory database with Drizzle ORM
- Node.js environment (not jsdom)
- Use `@praha/drizzle-factory` for test data generation

## Error Handling
- User-friendly Japanese error messages
- Server Components: Handle promises with proper error boundaries
- Use `error.tsx`, `not-found.tsx`, and `global-error.tsx` appropriately

## Performance Guidelines
- Optimize for Web Vitals (LCP, CLS, FID)
- Use WebP format for images
- Implement proper Suspense boundaries for streaming SSR
- Use dynamic loading for non-critical components