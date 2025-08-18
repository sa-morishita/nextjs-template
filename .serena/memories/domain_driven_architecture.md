# Domain-Driven Architecture

## Overview

The project follows Domain-Driven Design (DDD) principles to organize business logic and maintain clean architecture. The domain layer is independent of infrastructure concerns and focuses on business rules and validations.

## Domain Layer Structure

```
src/lib/domain/
├── auth.ts              # Authentication domain logic
├── upload.ts            # File upload domain rules
├── diary/               # Diary bounded context
│   ├── index.ts        # Public API exports
│   ├── constants.ts    # Domain constants
│   └── validators.ts   # Business rule validations
└── todos/              # Todos bounded context
    ├── index.ts        # Public API exports
    ├── constants.ts    # Domain constants
    └── validators.ts   # Business rule validations
```

## Domain Modules

### Auth Domain (`auth.ts`)
- User authentication rules
- Session validation logic
- Password policies
- Email verification requirements

### Upload Domain (`upload.ts`)
- File validation rules
- Size limits and constraints
- MIME type restrictions
- Path generation logic

### Diary Domain Module
```typescript
// constants.ts
export const DIARY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
} as const

export const DIARY_TYPE = {
  DIARY: 'diary',
  NOTE: 'note',
  MEMO: 'memo'
} as const

// validators.ts
export const diaryTitleSchema = z.string().max(100).optional()
export const diaryContentSchema = z.string().min(1).max(10000)
export const diaryStatusSchema = z.enum(['draft', 'published', 'archived'])
```

### Todos Domain Module
```typescript
// constants.ts
export const TODO_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const TODO_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

// validators.ts
export const todoTitleSchema = z.string().min(1).max(200)
export const todoDescriptionSchema = z.string().max(1000).optional()
export const todoPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
```

## Domain-Driven Patterns

### Value Objects
- Immutable objects representing domain concepts
- Examples: Email, UserId, DiaryStatus
- Encapsulate validation and business rules

### Entities
- Objects with identity that persist over time
- Examples: User, Diary, Todo
- Contain business logic specific to the entity

### Aggregates
- Clusters of entities and value objects
- Define transaction boundaries
- Examples: UserProfile (User + Settings), DiaryWithComments

### Domain Services
- Business logic that doesn't belong to entities
- Cross-cutting concerns within domain
- Examples: PasswordHasher, EmailValidator

## Layered Architecture Integration

### Application Flow
```
Presentation Layer (UI Components)
    ↓
Application Layer (Actions/Usecases)
    ↓
Domain Layer (Business Rules)
    ↓
Infrastructure Layer (Services/Queries/Mutations)
    ↓
Data Layer (Database)
```

### Layer Responsibilities

#### Domain Layer
- Pure business logic
- No framework dependencies
- No database knowledge
- No external service calls

#### Application Layer (Usecases)
- Orchestrates domain logic
- Coordinates between domain and infrastructure
- Implements use case scenarios
- Transaction management

#### Infrastructure Layer
- Database operations
- External service integration
- Framework-specific implementations
- Technical concerns

## Domain Rules Examples

### Diary Business Rules
1. **Content Requirements**
   - Must have content (not empty)
   - Maximum 10,000 characters
   - Optional title up to 100 characters

2. **Status Transitions**
   - Draft → Published → Archived
   - Archived entries cannot be edited
   - Only published entries appear in feeds

3. **Type Constraints**
   - Diary: Full-featured entries
   - Note: Quick thoughts
   - Memo: Reminders and tasks

### Todo Business Rules
1. **Priority Management**
   - Urgent todos appear first
   - Completed todos move to bottom
   - Overdue todos highlighted

2. **Status Workflow**
   - Pending → In Progress → Completed
   - Can be cancelled at any stage
   - Completed todos cannot be modified

3. **Validation Rules**
   - Title is required
   - Description optional but limited
   - Due dates must be future dates

## Benefits of Domain-Driven Design

### Maintainability
- Business logic centralized
- Easy to find and modify rules
- Clear separation of concerns

### Testability
- Pure functions easy to test
- No mocking of infrastructure
- Business rules tested in isolation

### Flexibility
- Infrastructure can change without affecting domain
- New features easy to add
- Business rules consistent across application

### Documentation
- Code documents business requirements
- Domain language matches business terms
- Self-documenting through types

## Future Domain Expansions

### Planned Domains
1. **Notification Domain**
   - Notification preferences
   - Delivery rules
   - Template management

2. **Analytics Domain**
   - User activity tracking
   - Report generation
   - Metrics calculation

3. **Collaboration Domain**
   - Sharing rules
   - Permission management
   - Team features

### Domain Evolution Strategy
1. Start with simple domain models
2. Extract common patterns
3. Refactor as complexity grows
4. Keep domain pure and testable