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

### Implementation Plan Structure
For each task, create a file named `task-{number}-{sanitized-title}.md` containing:

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

#### 3. TDD Approach

**RED Phase - Test Cases:**
```typescript
// Example test structure and assertions
describe('FeatureName', () => {
  it('should do X when Y', async () => {
    // Test setup
    // Assertions
  })
})
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
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting/formatting passes
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