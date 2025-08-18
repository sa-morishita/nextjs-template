# Authentication and Security Architecture

## Authentication System Overview

### Better Auth Integration
- **Location**: `src/services/auth/` (refactored from `src/lib/auth/`)
- **Database**: PostgreSQL with Better Auth tables
- **Session Management**: Database-backed sessions with configurable expiration
- **Authentication Methods**:
  - Email/Password with verification
  - LINE Login (social authentication)
  - Extensible for other OAuth providers

### Directory Structure
```
src/services/auth/
├── index.ts      # Main auth instance and exports
├── config.ts     # Better Auth configuration
├── client.ts     # Client-side hooks and utilities
└── service.ts    # Server-side auth services
```

### Authentication Flow

#### Registration Flow
1. User submits registration form
2. Server action validates input with Zod schema
3. Better Auth creates user account
4. Verification email sent via React Email/Resend
5. User clicks verification link
6. Account activated, user can sign in

#### Sign In Flow
1. User submits credentials
2. Server action validates input
3. Better Auth verifies credentials
4. Session created in database
5. Secure cookie set for session
6. User redirected to dashboard

#### Social Login Flow (LINE)
1. User clicks LINE login button
2. Redirected to LINE OAuth
3. LINE callback with authorization code
4. Better Auth exchanges code for tokens
5. User account created/linked
6. Session established

### Security Features

#### Email Verification
- Required for new accounts
- Secure token generation
- Expiration time limits
- React Email templates for professional emails

#### Password Security
- Bcrypt hashing
- Password strength validation
- Reset flow with secure tokens
- No password storage in plain text

#### Session Management
- Database-backed sessions
- Configurable expiration (default: 7 days)
- Secure HTTP-only cookies
- CSRF protection built-in

#### Middleware Protection
- `src/middleware.ts` validates all requests
- Protected routes under `/(protected)`
- Automatic redirect to sign-in for unauthenticated users
- Session refresh on activity

### Client-Side Utilities

#### React Hooks (from `src/services/auth/client.ts`)
```typescript
// Get current session
const { data: session, isPending } = useSession();

// Authentication actions
await signIn.email({ email, password });
await signUp.email({ email, password, name });
await signOut();
```

#### Server-Side Utilities
```typescript
// Get session in Server Components
const session = await getSession();

// Validate session in server actions
const { user } = await validateRequest();
```

### Database Schema

#### Better Auth Tables
- **user**: User accounts with profile information
- **session**: Active user sessions
- **account**: OAuth account connections
- **verification**: Email verification tokens
- **password_reset_token**: Password reset tokens

### Environment Configuration

#### Required Environment Variables
```
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="..."
EMAIL_FROM="..."

# OAuth (LINE)
LINE_CLIENT_ID="..."
LINE_CLIENT_SECRET="..."
```

### Integration Points

#### Protected Routes
- All routes under `/(protected)` require authentication
- Automatic session validation
- User context available throughout protected areas

#### Server Actions
- Authentication check at beginning of actions
- User ID available for data scoping
- Automatic error handling for unauthenticated requests

#### API Routes
- Better Auth handles `/api/auth/*` routes
- Custom API routes can use `validateRequest()`
- Consistent authentication across app

### Testing Authentication

#### Integration Tests
- Complete auth flow testing
- Session management validation
- Email verification simulation
- Password reset flow testing

#### Test Utilities
- Mock authentication for unit tests
- Test user factory for consistent data
- Session simulation helpers

### Security Best Practices Implemented

1. **No Client-Side Secrets**: All sensitive operations server-side
2. **HTTPS Required**: Enforced in production
3. **Secure Cookies**: HTTP-only, secure, same-site
4. **Rate Limiting**: Built into Better Auth
5. **Input Validation**: Zod schemas for all inputs
6. **SQL Injection Protection**: Parameterized queries via Drizzle
7. **XSS Protection**: React's built-in protections
8. **CSRF Protection**: Better Auth's built-in CSRF tokens

### Future Security Enhancements
- Two-factor authentication (2FA)
- OAuth provider expansion
- Advanced session management
- Audit logging
- IP-based restrictions