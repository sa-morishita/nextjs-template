# Essential Development Commands

## Primary Development Commands

### Core Development
```bash
pnpm dev              # Start development server with Turbopack at http://localhost:3000
pnpm build            # Build production application
pnpm start            # Start production server
```

### Code Quality & Validation (MOST IMPORTANT)
```bash
pnpm biome check --write .   # Run Biome check with auto-fix (RECOMMENDED for AI code updates)
pnpm typecheck               # TypeScript type checking
pnpm check:all               # Run all checks (Biome + TypeScript)
pnpm audit                   # Check for dependency vulnerabilities
```

### Testing
```bash
pnpm test                    # Run unit tests
pnpm test:watch              # Run unit tests in watch mode
pnpm test:integration        # Run integration tests with PGLite
pnpm test:integration:watch  # Run integration tests in watch mode
pnpm test:all                # Run both unit and integration tests
pnpm test:coverage           # Generate test coverage report
```

### Database Commands
```bash
pnpm db:push          # Push Drizzle schema changes directly to database (recommended for development)
pnpm db:studio        # Open Drizzle Studio for database management
pnpm db:generate      # Generate SQL migration files (for production)
pnpm db:migrate       # Apply generated migrations (for production)
```

### Supabase Local Commands
```bash
supabase start        # Start Supabase Local development environment
supabase stop         # Stop Supabase Local
supabase status       # Check status and get connection details
```

## Task Completion Workflow

When completing any coding task, ALWAYS run these commands in order:
1. `pnpm biome check --write .` - Fix linting and formatting issues
2. `pnpm typecheck` - Verify TypeScript types
3. `pnpm test` - Run unit tests to ensure nothing is broken
4. `pnpm test:integration` - Run integration tests (if applicable)

## System Utilities (macOS/Darwin)

### File Operations
```bash
ls -la               # List files with details
find . -name "*.ts"  # Find TypeScript files
grep -r "pattern"    # Search for patterns in files
```

### Git Operations
```bash
git status           # Check git status
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to remote
```

### Process Management
```bash
ps aux | grep node   # Find Node.js processes
kill -9 <PID>        # Kill process by PID
lsof -i :3000        # Check what's using port 3000
```

## Environment Setup Commands

### Initial Setup
```bash
pnpm install         # Install dependencies
pnpm lefthook install # Install git hooks
supabase start       # Start local database
cp .env.local.example .env.local  # Copy environment file
pnpm db:push         # Setup database schema
```