---
description: Generate implementation plans for spec tasks using TDD methodology
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers]
---

# Generate Implementation Plans with TDD

Generate detailed implementation plans for **$1** using Kent Beck's Test-Driven Development methodology.

## Instructions

### Pre-Execution Validation

Validate required files exist for feature **$1**:

- Requirements: `.kiro/specs/$1/requirements.md`
- Design: `.kiro/specs/$1/design.md`
- Tasks: `.kiro/specs/$1/tasks.md`
- Metadata: `.kiro/specs/$1/spec.json`

### Context Loading

**Core Steering:**

- Structure: @.kiro/steering/structure.md
- Tech Stack: @.kiro/steering/tech.md
- Product: @.kiro/steering/product.md

**Custom Steering:**

- Additional `*.md` files in `.kiro/steering/` (excluding structure.md, tech.md, product.md)

**Spec Documents for $1:**

- Metadata: @.kiro/specs/$1/spec.json
- Requirements: @.kiro/specs/$1/requirements.md
- Design: @.kiro/specs/$1/design.md
- Tasks: @.kiro/specs/$1/tasks.md

### Plan Generation

1. **Feature**: $1
2. **Task numbers**: $2 (optional, defaults to all pending tasks)
3. **Output directory**: `.kiro/specs/$1/implementation-plans/`
4. **Create implementation plan for each selected task**
5. **Document verification commands**: include the exact test commands plus `pnpm typecheck` and `pnpm biome check --write .`

### Implementation Plan Structure

For each task, create a file named `task-{number}-{sanitized-title}.md` containing:

#### 0. Required Context Documents (for standalone execution)

**IMPORTANT**: Before starting implementation, read ALL documents below using the Read tool to get complete and up-to-date information.

**Core Steering Documents**:

1. **Project Structure**: `.kiro/steering/structure.md`
   - Monorepo layout, directory conventions, component boundaries
   - File naming and organization standards

2. **Technology Stack**: `.kiro/steering/tech.md`
   - Framework versions, key libraries, development commands
   - Environment variables, port assignments

3. **Product Context**: `.kiro/steering/product.md`
   - Product summary, target users, value proposition
   - Current status and goals

**Feature-Specific Documents**:

4. **Requirements**: `.kiro/specs/$1/requirements.md`
   - All requirements for this feature
   - Acceptance criteria relevant to this task

5. **Design**: `.kiro/specs/$1/design.md`
   - Architectural patterns and decisions
   - Template conformance checklist
   - UI-First pattern guidance if applicable

**Custom Steering** (if exists):

- Any additional `*.md` files in `.kiro/steering/` (excluding structure.md, tech.md, product.md)

**Note**: This section provides references only, not summaries. By reading these files directly during implementation, you will always have access to the latest and most complete information.

#### 1. Task Overview

- Task ID and title
- Requirements summary
- Success criteria

#### 2. File Structure

```
# List all files to be created/modified
- path/to/new/file.ts (new)
- path/to/existing/file.ts (modify)
```

#### 2.5 UI-First Structure Determination

**CRITICAL**: Before generating TDD approach, determine if this task involves UI components.

##### If Task is X.1 (UI Shell):

**Required UI Structure** (following Template Conformance Checklist from design.md):

```
app/[feature]/page.tsx                                    ← RSC (orchestration, Suspense)
app/[feature]/_containers/[feature-name]/
    ├── index.tsx                                         ← re-export (export { FeatureContainer } from './container')
    ├── container.tsx                                     ← Server Component (async, data fetching via usecase)
    └── presentational.tsx                                ← Server Component (UI layout, imports from _components)
app/[feature]/_components/[feature]-form.tsx              ← Client Component ('use client' - useHookFormAction, interactions)
lib/actions/[feature].ts                                  ← Server Action (stub implementation)
lib/schemas/[feature].ts                                  ← Zod schemas (production-ready)
lib/constants/[feature]-messages.ts                       ← Constants (production-ready)
```

**CRITICAL**:

1. Never place files directly under `_containers`; always create a subdirectory (`[feature-name]/`) containing `index.tsx`, `container.tsx`, and `presentational.tsx`. This enables parallel data fetching with multiple Suspense boundaries in page.tsx (Next.js App Router best practice).
2. Implement `presentational.tsx` as a Server Component handling UI layout. Place Client Components requiring interactivity (forms, etc.) in `_components`. Maximize RSC usage for optimal performance.

**Server Action Stub Pattern:**

```typescript
// lib/actions/[feature].ts
'use server';

import { actionClient } from '@/lib/utils/safe-action';
import { [feature]Schema } from '@/lib/schemas';

export const [feature]Action = actionClient
  .metadata({ actionName: '[domain].[feature]' })
  .inputSchema([feature]Schema)
  .action(async ({ parsedInput }) => {
    // TODO: Task X.2 - Replace with real usecase call
    console.log('🔨 Mock [feature] action:', parsedInput);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true }; // Mock response
  });
```

**Client Component Production Pattern:**

```typescript
// _components/[feature]-form.tsx
'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { [feature]Action } from '@/lib/actions/[feature]';
import { [feature]Schema } from '@/lib/schemas';
import { MESSAGES } from '@/lib/constants/[feature]-messages';

export function [Feature]Form() {
  const router = useRouter();

  const { form, action, handleSubmitWithAction } = useHookFormAction(
    [feature]Action, // stub action, but production integration
    zodResolver([feature]Schema),
    {
      formProps: { mode: 'onSubmit', defaultValues: { /* ... */ } },
      actionProps: {
        onSuccess: () => {
          toast.success(MESSAGES.SUCCESS);
          router.push('/target-route');
        },
        onError: ({ error }) => {
          // Task X.4 - Implement convertActionErrorToMessage
          toast.error(MESSAGES.ERROR);
        },
      },
    }
  );

  return <Form {...form}>
    <form onSubmit={handleSubmitWithAction}>
      {/* Production form fields */}
    </form>
  </Form>;
}
```

##### If Task is X.2-X.3 (Backend Implementation):

**File Changes Limited To:**

- ✅ `lib/actions/[feature].ts` - Replace stub with real implementation
- ✅ `lib/usecases/[feature].ts` - Add business logic
- ✅ `lib/domain/[feature].ts` - Add domain logic
- ✅ `lib/services/*` - Add external integrations
- ❌ `_components/*-form.tsx` - **NO CHANGES**
- ❌ `_containers/*-container.tsx` - **Minimal changes** (only getSession() addition if needed)

**Backend Evolution Pattern:**

```typescript
// Task X.2: Replace stub with real implementation
export const [feature]Action = actionClient
  .metadata({ actionName: '[domain].[feature]' })
  .inputSchema([feature]Schema)
  .action(async ({ parsedInput }) => {
-   // TODO: Task X.2 - Replace with real usecase call
-   console.log('🔨 Mock [feature] action:', parsedInput);
-   await new Promise(resolve => setTimeout(resolve, 1000));
-   return { success: true };

+   // Real usecase integration
+   await [feature]Usecase(parsedInput);
+   redirect('/target-route');
  });
```

#### 3. TDD Approach (UI-First Pattern Applied)

**Task X.1 Testing Strategy:**

- Test Zod schemas (unit tests)
- Test client component behavior with stub actions (component tests)
- Server actions are stubs, tested only for structure validity

**Task X.2-X.3 Testing Strategy:**

- Unit tests for usecase/domain logic
- Integration tests for full server action → usecase → db flow
- UI components already tested in X.1, no retesting needed

**RED Phase - Test Cases:**

```typescript
// Example test structure and assertions
describe("FeatureName", () => {
  it("should do X when Y", async () => {
    // Test setup
    // Assertions
  });
});
```

**GREEN Phase - Implementation:**

```typescript
// File: path/to/implementation.ts
export async function functionName(params: ParamType): Promise<ReturnType> {
  // TODO: Validate input parameters
  // TODO: Main business logic
  // TODO: Return formatted response
}

// File: path/to/another-file.ts
export class ServiceName {
  // TODO: Initialize dependencies
  // TODO: Implement core methods
}
```

**REFACTOR Phase:**

- Extract common patterns to utilities
- Apply DRY principles
- Ensure consistent error handling
- Optimize for performance if needed

#### 4. Dependencies & Imports

- List all new dependencies
- Required imports for each file
- Any configuration changes needed

#### 5. Integration Points

- API endpoints affected
- Database schema changes
- External service interactions
- State management updates

#### 6. Verification Checklist

- [ ] All required tests pass (document concrete commands such as `pnpm test:unit`, `pnpm test:integration`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting/formatting passes (`pnpm biome check --write .`)
- [ ] No regression in existing tests
- [ ] Database migrations verified (use psql or direct SQL checks when schema changes occur)
- [ ] Browser/manual UI checks are delegated to developer when necessary
- [ ] Performance benchmarks (if applicable)

### Output Summary

After generating all plans:

1. List all generated plan files
2. Provide command to review plans: `cat .kiro/specs/$1/implementation-plans/*.md`
3. Next steps for actual implementation

## Implementation Notes

- **Feature**: Use `$1` for feature name
- **Tasks**: Use `$2` for specific task numbers (optional)
- **Sanitization**: Replace spaces with hyphens, lowercase task titles for filenames
- **Focus**: Generate actionable plans, not full implementations
- **Review**: Plans should be reviewable before actual coding begins
