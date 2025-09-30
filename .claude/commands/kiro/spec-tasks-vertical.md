---
description: Generate implementation tasks using vertical slice development approach
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep
argument-hint: <feature-name> [-y]
---

# Vertical Slice Implementation Tasks

Generate implementation tasks for feature: **$1** using vertical slice development approach

## Task: Generate Vertical Slice Implementation Tasks

### Prerequisites & Context Loading

- If invoked with `-y` flag ($2 == "-y"): Auto-approve requirements and design in `spec.json`
- Otherwise: Stop if requirements/design missing or unapproved with message:
  "Run `/kiro:spec-requirements` and `/kiro:spec-design` first, or use `-y` flag to auto-approve"
- If tasks.md exists: Prompt [o]verwrite/[m]erge/[c]ancel

**Context Loading (Full Paths)**:

1. `.kiro/specs/$1/requirements.md` - Feature requirements (EARS format)
2. `.kiro/specs/$1/design.md` - Technical design document
3. `.kiro/steering/` - Project-wide guidelines and constraints:
   - **Core files (always load)**:
     - @.kiro/steering/product.md - Business context, product vision, user needs
     - @.kiro/steering/tech.md - Technology stack, frameworks, libraries
     - @.kiro/steering/structure.md - File organization, naming conventions, code patterns
   - **Custom steering files** (load all EXCEPT "Manual" mode in `AGENTS.md`):
     - Any additional `*.md` files in `.kiro/steering/` directory
   - (Task planning benefits from comprehensive context)
4. `.kiro/specs/$1/tasks.md` - Existing tasks (only if merge mode)

### CRITICAL Task Numbering Rules (MUST FOLLOW)

**⚠️ MANDATORY: Sequential major task numbering & hierarchy limits**

- Major tasks: 1, 2, 3, 4, 5... (MUST increment sequentially)
- Sub-tasks: 1.1, 1.2, 2.1, 2.2... (reset per major task)
- **Maximum 2 levels of hierarchy** (no 1.1.1 or deeper)

### Vertical Slice Development Principles

**🎯 CORE PRINCIPLE: Each major task delivers a working, testable feature slice**

1. **Feature-First Approach**:
   - Each major task implements ONE complete user-facing feature
   - Include minimal DB, server logic, and UI in EVERY major task
   - Enable human testing after each major task completion
   - Prioritize visible progress over architectural perfection

2. **Task Structure Pattern** (choose based on feature complexity):

#### Pattern 1: Simple Features (2-split)

Use for: Basic CRUD operations, simple auth flows, straightforward page routing

```
X. [Feature Name] - Complete vertical slice
X.1 Full Implementation:
    - UI: Production-ready components (container/presentational, useHookFormAction, loading/error states)
    - Backend: Complete usecase/service/domain implementation
    - Integration: All layers connected and working
    - Result: Feature fully functional

X.2 Manual testing & refinement:
    - End-to-end verification
    - Edge case validation
    - UX improvements as needed
    - Result: Production-ready feature
```

#### Pattern 2: Medium Features (3-split) - **RECOMMENDED DEFAULT**

Use for: Multi-layer business logic, cache strategies, moderate state management

```
X. [Feature Name] - Complete vertical slice
X.1 UI Implementation with Stubs:
    - Production-ready UI structure (container/presentational, forms, loading/error states)
    - Server action stubs (console.log + immediate mock response)
    - Zod schemas, constants, error handling patterns
    - Result: UI fully functional with stubs

X.2 Backend Implementation & Integration:
    - Replace stubs with real usecase/service/domain logic
    - Database operations, auth integration, cache management
    - UI adjustments for discovered issues (minimal, bug fixes only)
    - Result: Full production-quality feature

X.3 Manual testing & refinement:
    - End-to-end verification
    - Edge case validation
    - Performance optimization if needed
    - Result: Polished production-ready feature
```

#### Pattern 3: Complex Features (5-split)

Use for: External API integration (OCR/AI), complex async workflows, payment processing

```
X. [Feature Name] - Complete vertical slice
X.1 UI Shell with Production Structure:
    - Create container/presentational components
    - Implement client components with useHookFormAction + next-safe-action
    - Create server action files with console.log stubs
    - Use Zod schemas, constants, and production error handling patterns
    - Result: UI is production-ready, only server action internals are stubs

X.2 Backend Foundations:
    - Replace console.log stubs with minimal real logic
    - Add external service integration scaffolding
    - Implement usecase/service layer scaffolding
    - Keep operations minimal (basic flow only)
    - Result: Server actions execute basic operations

X.3 Real Data Integration:
    - Complete usecase/domain/service layer implementation
    - Add comprehensive error handling and business logic validation
    - Implement cache invalidation and data synchronization
    - Result: Full production-quality backend

X.4 Fit & Finish:
    - Add advanced loading states, optimistic updates, error recovery
    - Implement comprehensive validation and edge case handling
    - Extract common utilities and refactor for maintainability
    - Result: Polished, production-ready feature slice

X.5 Manual testing checkpoint
```

**Key Principle**: UI code structure is production-ready from X.1, including loading/error states. Only server action **internals** evolve from stubs to full implementation.

2.1 **UI-First Production Structure Pattern (Revised)**:

**Core Principle**: UI components are production-ready from Task X.1, including loading/error states. Only server action **internals** evolve from stubs to implementation.

**Task X.1 Deliverables (for 3-split pattern):**

- ✅ Full container/presentational separation (page → container → presentational)
- ✅ Client components use `useHookFormAction` with next-safe-action
- ✅ **Loading states, error boundaries, disabled states implemented**
- ✅ Server action files with production structure + stub implementation
- ✅ Zod schemas, constants, error messages production-ready
- ⚠️ Server action internals: `console.log` + immediate mock response

**Task X.2 Evolution:**

- ✅ Replace stub internals with real usecase/service/domain layers
- ✅ UI bug fixes and minor adjustments allowed (avoid major refactoring)
- ❌ No changes to component structure or file organization

**Example - Task X.1 (Complete UI):**

```typescript
// lib/actions/feature.ts (production structure, stub internals)
export const featureAction = actionClient
  .metadata({ actionName: 'feature.action' })
  .inputSchema(featureSchema)
  .action(async ({ parsedInput }) => {
    console.log('🔨 TODO: X.2 - Implement', parsedInput);
    await new Promise(r => setTimeout(r, 300)); // Simulate network delay
    return { success: true, data: mockData }; // Type-safe mock
  });

// _components/feature-form.tsx (production-ready from start)
const { form, action, handleSubmitWithAction } = useHookFormAction(
  featureAction,
  zodResolver(featureSchema),
  {
    actionProps: {
      onSuccess: () => toast.success(MESSAGES.SUCCESS),
      onError: ({ error }) => toast.error(convertError(error)),
    },
  }
);

// ✅ Loading state already implemented in X.1
{action.isPending && <Spinner />}
{action.isPending && <Button disabled>送信中...</Button>}
```

**Benefits:**

- No UI refactoring between tasks (structure + states correct from start)
- Clear backend evolution path (stubs → real implementation)
- UI can be validated immediately with realistic interactions
- Tests work with production UI structure from day one

3. **MVP-First Progression with UI Validation**:

- Task 1: Absolute minimum viable feature (login, basic CRUD, etc.)
- Task 2-N: Add features incrementally, each delivering a visible UI slice before deep backend work
- Later tasks: Refine, optimize, add advanced features once UI behaviour is observable
- Final tasks: Polish, error handling, edge cases

4. **Early Validation Focus**:
   - Database migrations must be runnable after EVERY task
   - Server actions must be functional and testable after creation
   - UI structure is production-ready from Task X.1, only internals evolve
   - Include "manual testing checkpoint" sub-tasks

5. **Parallelization Analysis** (NEW):
   - **Common Foundation Phase**: Task 1 establishes shared infrastructure (auth, routing, schemas, utilities)
   - **Parallel Development Opportunities**: After foundation, analyze slice independence:
     - ✅ **Can parallelize**: Independent features with no shared domain logic/components
     - ⚠️ **Sequential recommended**: Features sharing utility functions, domain models, or complex state
   - **Dependency Markers**: Clearly mark tasks as:
     - `[Foundation]` - Must complete first (usually Task 1)
     - `[Independent]` - Can be developed in parallel after foundation
     - `[Depends on: X]` - Requires specific task completion
   - **Shared Code Strategy**: Document common code needs to avoid merge conflicts:
     - Extract shared utilities/types in foundation phase
     - Plan shared components separately if multiple slices need them
     - Prefer feature-local code initially, refactor to shared later

### Task Generation Rules

1. **Vertical Slice Structure**:
   - Start with foundational setup (auth, routing, basic layout)
   - Each subsequent task adds ONE complete feature
   - Features include: schema + server logic + UI + integration
   - Avoid "backend-only" or "frontend-only" major tasks

2. **Task Splitting Decision**:
   - **Default to 3-split pattern** for most features
   - **Use 2-split** for: Simple CRUD, basic auth flows, straightforward page routing
   - **Use 5-split** for: External API integration (OCR/AI), complex async workflows, payment processing
   - When in doubt, prefer fewer splits (easier to add detail than remove it)

3. **Checkpoint Frequency**:
   - **Type checking**: Once per major task completion (not per sub-task)
   - **Integration tests**: Once per major task completion
   - **Manual testing**: Last sub-task of each major task
   - **Lint/format**: As needed, typically with type checking

4. **Incremental Database Evolution**:
   - Add only tables/columns needed for current feature
   - Use migrations to evolve schema incrementally
   - Defer complex relationships until actually needed
   - Keep foreign keys simple in early iterations

5. **UI-First Visibility**:
   - Every major task must begin with a usable UI shell, even if backed by placeholder data
   - Use simple forms/tables before complex components
   - Replace mocks with live data in a dedicated sub-task (do not skip documenting the switch-over)
   - Basic styling is fine, polish comes later

6. **Natural language descriptions**:
   - Focus on capabilities and outcomes, not code structure
   - Describe **what functionality to achieve**
   - Use **domain language**, not programming constructs

7. **Manual Testing Checkpoints**:
   - Explicit sub-task for human verification
   - Clear steps: what to test, expected results
   - Include both happy path and basic error cases

### Example Vertical Slice Structure

#### Example 1: 3-Split Pattern (Recommended Default)

```markdown
# Implementation Plan - Vertical Slice Approach

## Parallelization Overview

- **Task 1** [Foundation] - Must complete first
- **Tasks 2-3** [Independent] - Can be developed in parallel after Task 1
- **Task 4** [Depends on: 2, 3] - Requires completion of tasks 2 and 3

---

- [ ] 1. Authentication feature [Foundation]
- [ ] 1.1 UI implementation with stubs
  - Render signin form with production structure (container/presentational)
  - Client component uses useHookFormAction + zodResolver + toast
  - Loading states, error boundaries, disabled states implemented
  - Server action stub: console.log + immediate success response
  - _Requirements: R1.1 - Auth UI foundation_

- [ ] 1.2 Backend implementation & integration
  - Configure Better Auth (lib/services/auth/config.ts)
  - Implement usecase/service layers
  - Replace stub with real authentication logic
  - Add middleware for route protection
  - Run `npx next typegen` for typed routes
  - Minor UI adjustments for discovered issues only
  - _Requirements: R1.1, R1.2, R1.3 - Complete auth flow_

- [ ] 1.3 Manual testing & refinement
  - Test signup/signin/signout flows end-to-end
  - Verify session persistence and redirects
  - Check error messaging in all scenarios
  - Adjust toast messages/timing if needed
  - _Requirements: Validate authentication works completely_

---

- [ ] 2. Task management feature [Independent]
  - **Note**: Independent of Task 3, can be developed in parallel
  - **Shared code**: Uses auth utilities from Task 1

- [ ] 2.1 UI implementation with stubs
  - Task list and creation form (container/presentational)
  - Loading/error states, optimistic updates UI
  - Server action stubs for CRUD operations
  - _Requirements: R2.1 - Task UI_

- [ ] 2.2 Backend implementation & integration
  - Add tasks table migration (id, title, user_id, status)
  - Implement queries/mutations with Drizzle
  - Replace stubs with real CRUD logic + cache tags
  - _Requirements: R2.1, R2.2 - Full task CRUD_

- [ ] 2.3 Manual testing & refinement
  - Test create/edit/delete operations
  - Verify multi-user isolation
  - Check cache invalidation behavior
  - _Requirements: Validate task management_

---

- [ ] 3. User profile [Independent]
  - **Note**: Independent of Task 2, can be developed in parallel
  - **Shared code**: Uses auth utilities from Task 1

- [ ] 3.1 UI implementation with stubs
  - Profile display and edit form (container/presentational)
  - Loading/error states implemented
  - Server action stubs for profile operations
  - _Requirements: R3.1 - Profile UI_

- [ ] 3.2 Backend implementation & integration
  - Profile schema, queries, mutations
  - Integration with auth context
  - Replace stubs with real logic
  - _Requirements: R3.1, R3.2 - Complete profile feature_

- [ ] 3.3 Manual testing & refinement
  - Test profile view and update flows
  - Verify validation and error handling
  - _Requirements: Validate profile management_

---

- [ ] 4. Dashboard integration [Depends on: 2, 3]
  - **Note**: Requires Tasks 2 and 3 completion (uses task and profile data)
  - **Shared code**: Depends on domain models from Tasks 2 and 3

- [ ] 4.1 UI implementation with stubs
  - Dashboard layout combining task and profile data
  - Loading/error states for aggregated data
  - Server action stubs for dashboard queries
  - _Requirements: R4.1 - Integrated dashboard_

- [ ] 4.2 Backend implementation & integration
  - Dashboard queries and aggregations
  - Cache management and real-time updates
  - Replace stubs with real implementation
  - _Requirements: R4.1, R4.2 - Dashboard analytics_

- [ ] 4.3 Manual testing & refinement
  - Test dashboard displays correct aggregated data
  - Verify real-time updates work
  - Check performance with larger datasets
  - _Requirements: Validate dashboard_
```

#### Example 2: 2-Split Pattern (Simple Features)

```markdown
- [ ] 5. Settings page [Independent]
  - **Note**: Simple CRUD, can be developed in parallel

- [ ] 5.1 Full implementation (UI + Backend)
  - Settings display and edit form (production-ready UI with loading/error states)
  - Settings schema, queries, mutations
  - Integration with user context
  - _Requirements: R5.1, R5.2 - Complete settings feature_

- [ ] 5.2 Manual testing & refinement
  - Test settings view and update flows
  - Verify validation and persistence
  - _Requirements: Validate settings management_
```

### Requirements Coverage Check

- **MANDATORY**: Ensure ALL requirements from requirements.md are covered
- Track which requirements are partially vs fully implemented
- Later tasks can enhance features introduced earlier
- No requirement should be left without any implementation

### Anti-Patterns to Avoid

❌ Building entire backend before any UI
❌ Creating all database tables upfront
❌ Mocking data for extended periods
❌ Separating backend and frontend into different major tasks
❌ Postponing integration until the end
❌ Over-splitting simple features into too many sub-tasks
❌ Running type checks/tests after every sub-task (do it per major task)
❌ Deferring loading/error states to later sub-tasks (include in X.1)

### Document Generation

- Generate `.kiro/specs/$1/tasks.md` using vertical slice approach with parallelization analysis
- **REQUIRED SECTIONS**:
  1. **Parallelization Overview** (at the top):
     - List all major tasks with their dependency markers
     - Clearly identify which tasks can run in parallel
     - Document shared code dependencies
  2. **Task Groups** (separated by `---`):
     - Foundation tasks first
     - Independent tasks grouped together
     - Dependent tasks with clear prerequisite markers
- **Task Annotations**:
  - `[Foundation]` - Must complete sequentially first
  - `[Independent]` - Can be developed in parallel after foundation
  - `[Depends on: X, Y]` - Requires specific tasks
  - Add **Note** explaining parallelization possibility and shared code
- **Shared Code Documentation**:
  - Identify common utilities/types/components in foundation phase
  - Note which slices share domain models or complex state
  - Recommend extraction of shared code early to avoid conflicts
- **Language**: Use language from `spec.json.language` field, default to English
- Update `.kiro/specs/$1/spec.json`:
  - Set `phase: "tasks-generated"`
  - Set approvals map exactly as:
    - `approvals.tasks = { "generated": true, "approved": false }`
  - Add `approach: "vertical-slice"` to metadata
  - Add `parallelization_analysis: true` to metadata
  - Preserve existing metadata
  - Set `updated_at` to current ISO8601 timestamp

---

## INTERACTIVE APPROVAL IMPLEMENTED (Not included in document)

The following is for Claude Code conversation only - NOT for the generated document:

## Vertical Slice Benefits

This approach ensures:

- 🚀 Faster feedback loops with working features
- 🔍 Early detection of integration issues
- 👤 Human-testable results after each major task
- 📈 Visible progress throughout development
- 🛠️ Easier debugging with smaller change sets
- ⚡ **Parallel development opportunities** after foundation phase
- 🎯 Clear dependency tracking for efficient team coordination
- ⏱️ **Reduced overhead** with fewer type checks/tests (once per major task vs. per sub-task)
- 🎨 **Complete UI from start** including loading/error states, no refactoring needed

## Parallelization Strategy

**Foundation Phase** (Sequential):

- Task 1 must be completed first
- Establishes shared infrastructure, utilities, and patterns
- Creates common types, auth helpers, and base components

**Independent Development** (Parallel):

- Tasks marked `[Independent]` can be developed simultaneously
- Each developer/AI can work on separate feature slices
- Minimal merge conflicts due to clear boundaries
- Faster overall delivery through concurrent work

**Dependency Management**:

- Tasks marked `[Depends on: X]` wait for prerequisites
- Shared code extracted early to avoid conflicts
- Feature-local code preferred initially, refactored to shared later

## Next Phase: Incremental Implementation

After generating tasks.md, implementation proceeds iteratively:

**Each completed major task results in:**

- A deployable feature (even if minimal)
- Real user interactions possible
- Validated integration between all layers
- Confidence before moving to next feature

**Parallel Development Workflow**:

1. Complete foundation task(s) first
2. Identify independent slices from parallelization overview
3. Assign/execute independent tasks concurrently
4. Merge and integrate as slices complete
5. Execute dependent tasks once prerequisites are met

### Next Steps: Implementation

Once tasks are approved, start implementation:

```bash
/kiro:spec-impl $1          # Execute all pending tasks
/kiro:spec-impl $1 1        # Complete entire feature slice
/kiro:spec-impl $1 2.3      # Execute specific sub-task
```

**Implementation Tips**:

- Complete entire major tasks before moving to next
- Always run manual testing checkpoints
- Commit after each feature slice works
- Use `/clear` if needed, spec files persist

### Review Checklist (for user reference):

- [ ] Each major task delivers working functionality
- [ ] Manual testing checkpoints included
- [ ] Database evolves incrementally
- [ ] UI provides early feedback
- [ ] No "backend-only" major tasks

think deeply
