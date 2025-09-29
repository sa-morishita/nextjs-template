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

2. **Task Structure Pattern** (for each feature):
   ```
   X. [Feature Name] - Complete vertical slice
   X.1 Database: Minimal schema for this feature only
   X.2 Backend: Server actions and data logic
   X.3 Frontend: Basic working UI components
   X.4 Integration: Wire everything together
   X.5 Manual testing checkpoint
   ```

3. **MVP-First Progression**:
   - Task 1: Absolute minimum viable feature (login, basic CRUD, etc.)
   - Task 2-N: Add features incrementally, each fully functional
   - Later tasks: Refine, optimize, add advanced features
   - Final tasks: Polish, error handling, edge cases

4. **Early Validation Focus**:
   - Database migrations must be runnable after EVERY task
   - Server actions must be functional and testable after creation
   - UI must show real data, not mocks, as early as possible
   - Include "manual testing checkpoint" sub-tasks

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
   - Even if ugly, get UI working early
   - Use simple forms/tables before complex components  
   - Real data over mocks from the start
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

- [ ] 1. Foundation and minimal authentication
- [ ] 1.1 Set up project with core infrastructure
  - Initialize project with required stack
  - Configure basic routing and middleware
  - Set up development environment
  - Create minimal database connection
  - _Requirements: Infrastructure setup_

- [ ] 1.2 Create user authentication schema
  - Design users table with essential fields only
  - Add sessions/tokens table
  - Create initial migration
  - _Requirements: 7.1_

- [ ] 1.3 Build authentication server actions
  - Implement user registration server action
  - Create login action with session management
  - Add logout server action
  - Handle validation and error responses
  - _Requirements: 7.1, 7.2_

- [ ] 1.4 Create minimal authentication UI
  - Build simple login form with server action
  - Add registration form component
  - Show logged-in state using server components
  - Handle server action responses and errors
  - _Requirements: 7.1, 7.2_

- [ ] 1.5 Manual testing checkpoint
  - Test user registration flow
  - Verify login/logout works
  - Check session persistence
  - Confirm error messages display
  - _Requirements: Validate authentication works end-to-end_

- [ ] 2. Core feature: Task management basics
- [ ] 2.1 Add tasks schema
  - Create tasks table (id, title, user_id only)
  - Add foreign key to users
  - Run migration
  - _Requirements: 2.1_

- [ ] 2.2 Implement task CRUD server actions
  - Create task server action
  - Implement server component for listing tasks
  - Update task server action
  - Delete task server action
  - _Requirements: 2.1, 2.2_

- [ ] 2.3 Build task management UI
  - Create task list component
  - Add new task form
  - Implement inline editing
  - Add delete buttons
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 2.4 Wire frontend to server actions
  - Connect forms to server actions
  - Handle loading states with useFormStatus
  - Show server action errors
  - Revalidate data after mutations
  - _Requirements: Integration_

- [ ] 2.5 Manual testing checkpoint
  - Create multiple tasks
  - Edit task titles
  - Delete tasks
  - Verify data persists on refresh
  - Test with multiple users
  - _Requirements: Validate task management_
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
- Generate `.kiro/specs/$1/tasks.md` using vertical slice approach
- **Language**: Use language from `spec.json.language` field, default to English
- Update `.kiro/specs/$1/spec.json`:
  - Set `phase: "tasks-generated"`
  - Set approvals map exactly as:
    - `approvals.tasks = { "generated": true, "approved": false }`
  - Add `approach: "vertical-slice"` to metadata
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

## Next Phase: Incremental Implementation

After generating tasks.md, implementation proceeds iteratively:

**Each completed major task results in:**
- A deployable feature (even if minimal)
- Real user interactions possible
- Validated integration between all layers
- Confidence before moving to next feature

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