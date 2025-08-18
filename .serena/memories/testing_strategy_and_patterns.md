# Testing Strategy and Patterns

## Testing Architecture Overview

The project implements a comprehensive testing strategy with three distinct types of tests, each serving specific purposes and using appropriate tools.

## Test Types

### 1. Unit Tests (`*.test.ts`, `*.test.tsx`)
- **Purpose**: Test individual components and functions in isolation
- **Environment**: jsdom for browser simulation
- **Framework**: Vitest with React Testing Library
- **Location**: `__tests__/` directories next to source files
- **Config**: `vitest.config.mts`

### 2. Integration Tests (`*.integration.test.ts`)
- **Purpose**: Test data flows and database operations
- **Environment**: Node.js (no DOM)
- **Database**: PGLite in-memory PostgreSQL
- **Location**: `__tests__/` directories in service layers
- **Config**: `vitest.integration.config.mts`

### 3. Storage Tests (`*.storage.test.ts`)
- **Purpose**: Test file storage operations
- **Environment**: Mock file system
- **Framework**: Custom storage adapters with mocks
- **Location**: Service layer test directories

## Testing Patterns

### Container/Presentational Testing

#### Container Component Tests
```typescript
// Test as async function returning ReactElement
describe('TodoListContainer', () => {
  it('should fetch and display todos', async () => {
    const container = await TodoListContainer({ userId: 'test-123' })
    expect(container.type).toBe(TodoListPresentation)
    expect(container.props.todos).toHaveLength(3)
  })
})
```

#### Presentational Component Tests
```typescript
// Test with React Testing Library
describe('TodoListPresentation', () => {
  it('should render todos and handle interactions', async () => {
    const { user } = setup()
    render(<TodoListPresentation todos={mockTodos} />)
    
    await user.click(screen.getByRole('checkbox', { name: /complete/i }))
    expect(onToggle).toHaveBeenCalledWith(mockTodos[0].id)
  })
})
```

### Integration Testing with PGLite

#### Database Setup
```typescript
import { createTestDatabase } from '@/test/utils/database'

describe('Todo Service Integration', () => {
  let db: DrizzleClient
  
  beforeEach(async () => {
    db = await createTestDatabase()
  })
  
  afterEach(async () => {
    await db.$client.close()
  })
})
```

#### Test Data Factories
```typescript
import { userFactory, todoFactory } from '@/test/factories'

beforeEach(() => {
  // Reset factory sequences for test isolation
  userFactory.resetSequence()
  todoFactory.resetSequence()
})

it('should create todo for user', async () => {
  const user = await userFactory.create()
  const todo = await todoFactory.create({ userId: user.id })
  
  expect(todo.userId).toBe(user.id)
})
```

### Storage Testing Patterns

#### Mock File System
```typescript
describe('Profile Image Upload', () => {
  const mockStorage = createMockStorageAdapter()
  
  it('should upload and return URL', async () => {
    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' })
    const result = await mockStorage.upload(file, 'profiles/123/avatar.jpg')
    
    expect(result.url).toContain('profiles/123/avatar.jpg')
    expect(mockStorage.exists('profiles/123/avatar.jpg')).toBe(true)
  })
})
```

## Test Organization

### Directory Structure
```
src/
├── components/
│   └── todo-list/
│       ├── __tests__/
│       │   ├── container.test.tsx
│       │   └── presentational.test.tsx
│       ├── container.tsx
│       └── presentational.tsx
├── lib/
│   ├── mutations/
│   │   └── __tests__/
│   │       └── todos.integration.test.ts
│   ├── queries/
│   │   └── __tests__/
│   │       └── todos.integration.test.ts
│   └── services/
│       └── __tests__/
│           ├── auth.integration.test.ts
│           └── profile-image.storage.test.ts
```

## Mock Strategies

### Query/Mutation Level Mocking
```typescript
// Mock at service boundaries, not database
vi.mock('@/lib/queries/todos', () => ({
  getTodosByUserId: vi.fn().mockResolvedValue(mockTodos)
}))
```

### Navigation Mocking
```typescript
// Global setup in src/test/setup.ts
const mockPush = vi.fn()
const mockRouter = { push: mockPush, back: vi.fn() }

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path'
}))
```

### Authentication Mocking
```typescript
// Mock Better Auth hooks
vi.mock('@/services/auth/client', () => ({
  useSession: () => ({ data: mockSession, isPending: false })
}))
```

## Test Utilities

### Common Test Helpers
```typescript
// src/test/utils/setup.ts
export function setup() {
  return {
    user: userEvent.setup(),
    renderWithProviders: (ui: ReactElement) => {
      return render(
        <Providers>{ui}</Providers>
      )
    }
  }
}
```

### Database Test Helpers
```typescript
// src/test/utils/database.ts
export async function createTestDatabase() {
  const client = new PGlite()
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })
  return db
}

export async function seedTestData(db: DrizzleClient) {
  const users = await userFactory.createMany(3)
  const todos = await todoFactory.createMany(5, { userId: users[0].id })
  return { users, todos }
}
```

## Running Tests

### Commands
```bash
# Run all unit tests
pnpm test:unit

# Run specific test file
pnpm test src/components/todo-list/__tests__/container.test.tsx

# Run tests in watch mode
pnpm test:watch

# Run integration tests
pnpm test:integration

# Run specific integration test
pnpm test:integration src/lib/mutations/__tests__/todos.integration.test.ts

# Generate coverage report
pnpm test:coverage
```

### CI/CD Integration
- Pre-commit: Run affected tests
- Pre-push: Run all tests
- PR checks: Full test suite with coverage
- Deploy: Integration tests against staging

## Best Practices

### Test Naming
```typescript
// Use descriptive test names
it('should display error message when todo creation fails', async () => {})

// Group related tests
describe('TodoList > Filtering', () => {
  it('should filter by completed status', () => {})
  it('should filter by priority', () => {})
})
```

### Test Data
```typescript
// Use factories for consistent test data
const todo = todoFactory.build({ 
  title: 'Test Todo',
  completed: false 
})

// Avoid hardcoded IDs
const userId = crypto.randomUUID()
```

### Async Testing
```typescript
// Always await async operations
await waitFor(() => {
  expect(screen.getByText('Todo created')).toBeInTheDocument()
})

// Use findBy queries for async elements
const todoItem = await screen.findByRole('listitem')
```

### Error Testing
```typescript
// Test both success and error paths
it('should handle network errors gracefully', async () => {
  server.use(
    http.post('/api/todos', () => {
      return HttpResponse.error()
    })
  )
  
  // Test error UI appears
})
```

## Coverage Goals

### Target Coverage
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### Critical Path Coverage
- Authentication flows: 100%
- Data mutations: 95%
- Error handling: 90%
- User interactions: 85%

### Coverage Reports
```bash
# Generate HTML coverage report
pnpm test:coverage

# View coverage in browser
open coverage/index.html
```