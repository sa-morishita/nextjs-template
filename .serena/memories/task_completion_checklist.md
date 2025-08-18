# Task Completion Checklist

## MANDATORY Steps When Completing Any Code Task

### 1. Code Quality Checks (REQUIRED)
```bash
# ALWAYS run these commands after making code changes:
pnpm biome check --write .   # Fix all linting and formatting issues
pnpm typecheck               # Ensure TypeScript types are correct
```

### 2. Testing Verification (REQUIRED)
```bash
# Run appropriate tests based on changes made:
pnpm test                    # Unit tests (always run)
pnpm test:integration        # Integration tests (if database/API changes)
```

### 3. Build Verification (REQUIRED for significant changes)
```bash
pnpm build                   # Ensure production build succeeds
```

## Pre-Commit Validation (Automatic via Lefthook)

The following checks run automatically on `git commit`:
- Biome linting and formatting on staged files
- TypeScript type checking
- Unit tests
- Integration tests

## Development Workflow Checks

### When Adding New Dependencies
```bash
pnpm audit                   # Check for security vulnerabilities
```

### When Modifying Database Schema
```bash
pnpm db:push                 # Apply schema changes to local database
pnpm db:studio               # Verify changes in Drizzle Studio
```

### When Working with Supabase Local
```bash
supabase status              # Ensure local services are running
# Verify API: http://localhost:54321
# Verify DB: localhost:54322
```

## Error Resolution Guidelines

### If Biome Check Fails
1. Run `pnpm biome check --write .` to auto-fix issues
2. Manually resolve any remaining errors
3. Re-run the check to confirm

### If TypeScript Check Fails
1. Address type errors in the reported files
2. Ensure all imports are properly typed
3. Re-run `pnpm typecheck` to confirm

### If Tests Fail
1. Read test output carefully
2. Fix the underlying issue (not just the test)
3. Re-run tests to confirm fixes
4. If integration tests fail, check database connection

### If Build Fails
1. Check for missing dependencies
2. Verify environment variables are properly configured
3. Ensure all imports are resolvable
4. Check for TypeScript errors that may have been missed

## Performance and Security Checks

### Before Deploying
- Ensure no secrets are committed to repository
- Verify all environment variables are properly configured
- Check that SSL settings are appropriate for environment
- Run security audit: `pnpm audit`

### Code Review Checklist
- [ ] No `console.log` statements in production code
- [ ] Proper error handling with user-friendly messages
- [ ] Appropriate use of Server vs Client Components
- [ ] Proper TypeScript types (no `any` unless absolutely necessary)
- [ ] Tests cover new functionality
- [ ] Performance considerations (Web Vitals)
- [ ] Accessibility compliance (ARIA labels, semantic HTML)

## Environment-Specific Considerations

### Local Development
- Supabase Local must be running
- Use HTTP (not HTTPS) for local URLs
- Database connects directly (port 54322)

### Production
- Use HTTPS for all URLs
- Database uses Connection Pooler (port 6543)
- SSL required for database connections
- Prepare statements disabled for pooler compatibility