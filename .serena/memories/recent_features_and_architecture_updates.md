# Recent Features and Architecture Updates

## Major Updates (Latest Commits)

### 1. Authentication Refactoring (PR #13)
- **Moved authentication code from `src/lib/auth/` to `src/services/auth/`**
- Better organization: config, client, service logic separated
- Authentication is now centralized in the services layer for consistency

### 2. New Features Implemented

#### Diary Feature (日記機能)
- **Database Schema**: `diaries` table with user association
- **Fields**: id, userId, title, content, imageUrl, status (draft/published/archived), type (diary/note/memo)
- **Indexes**: Optimized for user queries and date-based retrieval
- **Full CRUD operations** with integration tests
- **Location**: `src/app/(protected)/dashboard/diary`

#### Profile & Image Upload
- **Profile image upload** functionality with Supabase Storage
- **Services**: 
  - `image-upload.service.ts` - Server-side upload logic
  - `image-upload-client.service.ts` - Client-side upload handling
  - `profile-image.service.ts` - Profile image management
- **Storage tests**: Comprehensive testing for upload functionality

#### Task Management (タスク管理)
- **Location**: `src/app/(protected)/dashboard/tasks`
- Integrated with existing todos system
- Protected route requiring authentication

#### My Page (マイページ)
- **Location**: `src/app/(protected)/dashboard/mypage`
- User profile management
- Dashboard integration

### 3. Domain-Driven Design Implementation

#### Domain Layer Structure
```
src/lib/domain/
├── auth.ts           # Authentication domain logic
├── upload.ts         # File upload domain logic
├── diary/            # Diary domain module
│   ├── index.ts      # Domain exports
│   ├── constants.ts  # Domain constants
│   └── validators.ts # Domain validation rules
└── todos/            # Todos domain module
    ├── index.ts
    ├── constants.ts
    └── validators.ts
```

### 4. Testing Infrastructure

#### Integration Testing
- **PGLite** in-memory database for testing
- **Test files**: `*.integration.test.ts`
- **Test data factories** with `@praha/drizzle-factory`
- **Complete test coverage** for:
  - Todos CRUD operations
  - Diary CRUD operations
  - Authentication flows
  - Storage operations

#### Test Organization
```
src/lib/
├── mutations/__tests__/
├── queries/__tests__/
├── usecases/__tests__/
└── services/__tests__/
```

### 5. LINE Login Integration
- Support for LINE authentication added to Better Auth
- Social login alongside email/password authentication

### 6. Form System Improvements
- Standardized form components using shadcn/ui pattern
- Consistent validation with Zod schemas
- Server actions with next-safe-action v8

### 7. Dashboard Layout Improvements
- Component separation for better maintainability
- Improved sign-out process
- Responsive layout with Tailwind CSS v4

## Architecture Patterns

### Service Layer Pattern
All business logic now follows:
```
Actions → Usecases → Services/Mutations/Queries → Database
```

### Domain-Driven Design
- Domain models and validators separated from infrastructure
- Business rules encapsulated in domain layer
- Clear separation of concerns

### Testing Strategy
- Unit tests for components and utilities
- Integration tests for data flows
- Storage tests for file operations
- Mock at service boundaries, not database level

## Database Schema Updates

### New Tables
1. **diaries** - Full diary management system
2. **user profiles** - Extended with image URL support

### Migration Strategy
- Drizzle ORM migrations
- Seed scripts for development
- Timezone-aware timestamps

## Environment & Configuration
- Updated to Next.js 15.4.6
- Improved development workflow
- Enhanced TypeScript strict mode
- Biome linting with custom rules
- Git hooks via Lefthook

## Future Considerations
- Email notification system ready
- Extensible upload service for multiple file types
- Domain modules can be easily extended
- Test infrastructure supports rapid development