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

2. **Task Structure Pattern** (for each feature, enforce UI-first production-ready structure):

```
X. [Feature Name] - Complete vertical slice
X.1 UI Shell with Production Structure:
    - Create container/presentational components following Template Conformance Checklist
    - Implement client components with useHookFormAction + next-safe-action from the start
    - Create server action files with console.log stubs (production structure, mock implementation)
    - Use Zod schemas, constants, and production error handling patterns
    - Result: UI is production-ready, only server action internals are stubs

X.2 Backend Foundations:
    - Replace console.log stubs in server actions with minimal real logic
    - Add Better Auth integration, middleware, typed routes configuration
    - Implement usecase/service layer scaffolding
    - Keep database operations minimal (basic CRUD only)
    - Result: Server actions execute real authentication/data operations

X.3 Real Data Integration:
    - Complete usecase/domain/service layer implementation
    - Add comprehensive error handling and business logic validation
    - Implement cache invalidation and data synchronization
    - Result: Full production-quality backend with zero UI changes

X.4 Fit & Finish:
    - Add loading states, optimistic updates, error recovery
    - Implement comprehensive validation and edge case handling
    - Extract common utilities and refactor for maintainability
    - Result: Polished, production-ready feature slice

X.5 Manual testing checkpoint
```

**Key Principle**: UI code structure is production-ready from X.1; only server action **internals** evolve from stubs to full implementation.

2.1 **UI-First Production Structure Pattern**:

**Core Principle**: UI components match final production structure from Task X.1, avoiding refactoring in later tasks.

**Task X.1 Implementation:**

- ✅ Full container/presentational separation (page → container → presentational)
- ✅ Client components use `useHookFormAction` with next-safe-action
- ✅ Server action files exist with production structure but stub implementation
- ✅ Zod schemas, constants, error messages are production-ready
- ⚠️ Server action logic is `console.log` + mock delay only

**Task X.2-X.3 Evolution:**

- ✅ Replace server action stub internals with real implementation
- ✅ Add usecase/domain/service layers behind server actions
- ❌ **Zero changes to UI component files**

**Example - Task X.1:**

```typescript
// lib/actions/feature.ts (production structure, stub implementation)
export const featureAction = actionClient
  .metadata({ actionName: "feature.action" })
  .inputSchema(featureSchema)
  .action(async ({ parsedInput }) => {
    console.log("🔨 TODO: Implement in Task X.2", parsedInput);
    await new Promise((r) => setTimeout(r, 500));
    return { success: true }; // Mock response
  });

// _components/feature-form.tsx (production-ready from start)
const { form, action, handleSubmitWithAction } = useHookFormAction(
  featureAction, // stub action, but real integration
  zodResolver(featureSchema),
  {
    actionProps: {
      onSuccess: () => toast.success(MESSAGES.SUCCESS),
      onError: ({ error }) => toast.error(convertError(error)),
    },
  }
);
```

**Benefits:**

- No UI refactoring between tasks (structure correct from start)
- Clear backend evolution path (stubs → real implementation)
- UI team can work independently with stub actions
- Tests work immediately with production UI structure

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

2. **Incremental Database Evolution**:
   - Add only tables/columns needed for current feature
   - Use migrations to evolve schema incrementally
   - Defer complex relationships until actually needed
   - Keep foreign keys simple in early iterations

3. **UI-First Visibility**:
   - Every major task must begin with a usable UI shell, even if backed by placeholder data
   - Use simple forms/tables before complex components
   - Replace mocks with live data in a dedicated sub-task (do not skip documenting the switch-over)
   - Basic styling is fine, polish comes later

4. **Natural language descriptions** (same as original):
   - Focus on capabilities and outcomes, not code structure
   - Describe **what functionality to achieve**
   - Use **domain language**, not programming constructs

5. **Manual Testing Checkpoints**:
   - Explicit sub-task for human verification
   - Clear steps: what to test, expected results
   - Include both happy path and basic error cases

### Example Vertical Slice Structure

```markdown
# Implementation Plan - Vertical Slice Approach

## Parallelization Overview

- **Task 1** [Foundation] - Must complete first (establishes auth, routing, shared utilities)
- **Tasks 2-4** [Independent] - Can be developed in parallel after Task 1
- **Task 5** [Depends on: 2, 3] - Requires completion of tasks 2 and 3

---

- [ ] 1. Foundation and minimal authentication [Foundation]
- [ ] 1.1 Prototype authentication UI with temporary client-side validation
  - Render login and sign-up forms with static handlers and mocked responses
  - Display simple success/error states without calling the server
  - _Requirements: Infrastructure setup_

- [ ] 1.2 Introduce authentication schema and lightweight server stubs
  - Add users table with essential fields only
  - Create server actions that return canned data to match the mocked UI
  - Keep migrations minimal so UI continues to function
  - _Requirements: 7.1_

- [ ] 1.3 Replace stubs with real authentication logic
  - Implement registration/login/logout actions backed by the database
  - Remove temporary client-side mocks and connect UI to live responses
  - Add error handling paths surfaced in the UI
  - _Requirements: 7.1, 7.2_

- [ ] 1.4 Fit & finish
  - Introduce loading indicators, disabled states, and session awareness in the header
  - Ensure redirects and cache revalidation behave correctly
  - Extract common auth utilities to `lib/utils/auth-helpers.ts` for reuse
  - _Requirements: 7.1, 7.2_

- [ ] 1.5 Manual testing checkpoint
  - Execute registration/login/logout via the UI
  - Confirm session persistence and error messaging end-to-end
  - _Requirements: Validate authentication works end-to-end_

---

- [ ] 2. Core feature: Task management basics [Independent]
  - **Note**: Independent of Tasks 3-4, can be developed in parallel
  - **Shared code**: Uses auth utilities from Task 1, no other dependencies

- [ ] 2.1 Sketch task dashboard UI with mocked data
  - Build task list and creation form components using in-memory data
  - Demonstrate optimistic updates visually without persistence
  - _Requirements: 2.1, 3.1_

- [ ] 2.2 Add minimal task schema and server stubs
  - Create tasks table (id, title, user_id only) and migration
  - Supply server action placeholders that echo fake responses consumed by the UI
  - _Requirements: 2.1_

- [ ] 2.3 Implement real task CRUD logic and wire up the UI
  - Replace stubbed actions with actual create/list/update/delete operations
  - Connect UI components to live data and remove temporary mocks
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 2.4 Extend interactions and state handling
  - Add loading indicators, error toasts, and cache invalidation
  - Ensure multi-user isolation and optimistic update rollback
  - _Requirements: Integration_

- [ ] 2.5 Manual testing checkpoint
  - Create, edit, and delete tasks through the UI and verify persistence
  - Confirm behaviour across refreshes and concurrent sessions
  - _Requirements: Validate task management_

---

- [ ] 3. User profile management [Independent]
  - **Note**: Independent of Tasks 2, 4, can be developed in parallel
  - **Shared code**: Uses auth utilities from Task 1

- [ ] 3.1 Profile UI shell with mocked data
  - _Requirements: User profile display_

- [ ] 3.2 Profile schema and server stubs
  - _Requirements: Profile schema_

- [ ] 3.3 Real profile update logic
  - _Requirements: Profile editing_

- [ ] 3.4 Profile validation and error handling
  - _Requirements: Validation_

- [ ] 3.5 Manual testing checkpoint
  - _Requirements: Validate profile management_

---

- [ ] 4. Settings and preferences [Independent]
  - **Note**: Independent of Tasks 2, 3, can be developed in parallel
  - **Shared code**: Uses auth utilities from Task 1

- [ ] 4.1 Settings UI shell
  - _Requirements: Settings page_

- [ ] 4.2 Settings schema and server stubs
  - _Requirements: Settings schema_

- [ ] 4.3 Real settings logic
  - _Requirements: Settings management_

- [ ] 4.4 Settings validation
  - _Requirements: Validation_

- [ ] 4.5 Manual testing checkpoint
  - _Requirements: Validate settings_

---

- [ ] 5. Dashboard integration [Depends on: 2, 3]
  - **Note**: Requires Tasks 2 and 3 completion (uses task and profile data)
  - **Shared code**: Depends on domain models from Tasks 2 and 3

- [ ] 5.1 Dashboard UI combining task and profile data
  - _Requirements: Integrated dashboard_

- [ ] 5.2 Dashboard queries and aggregations
  - _Requirements: Dashboard analytics_

- [ ] 5.3 Real-time updates and cache management
  - _Requirements: Real-time sync_

- [ ] 5.4 Dashboard polish and optimization
  - _Requirements: Performance_

- [ ] 5.5 Manual testing checkpoint
  - _Requirements: Validate dashboard_
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
