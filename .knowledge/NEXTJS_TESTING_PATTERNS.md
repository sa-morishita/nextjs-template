# Next.js テストパターンリファレンス

## テスト環境構成

### 環境変数
- .env.test: テスト専用環境変数
- NODE_ENV=test での分岐処理

```bash
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="test-anon-key"
SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"
BETTER_AUTH_SECRET="test-secret"
```

### データベース戦略
実装例: src/test/utils.ts
- PGlite でのインメモリ DB（単体テスト）
- TestContainers での実際の PostgreSQL（統合テスト）
- createTestDatabase での独立環境構築

```typescript
// src/test/utils.ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

// インメモリDBでのテスト用データベース作成
export async function createTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  
  // マイグレーション実行
  await migrate(db, { migrationsFolder: "drizzle" });
  
  return { db, client };
}

// TestContainersでの統合テスト用
import { PostgreSqlContainer } from "@testcontainers/postgresql";

export async function createIntegrationTestDatabase() {
  const container = await new PostgreSqlContainer("postgres:16")
    .withDatabase("test")
    .withUsername("test")
    .withPassword("test")
    .start();
  
  const connectionString = container.getConnectionUri();
  const db = drizzle(connectionString, { schema });
  
  await migrate(db, { migrationsFolder: "drizzle" });
  
  return { db, container, connectionString };
}
```

### Vitest設定
```typescript
// vitest.config.mts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.type.ts",
      ],
    },
  },
});

// vitest.integration.config.mts
export default defineConfig({
  // ... 基本設定同じ
  test: {
    environment: "node", // 統合テストはnode環境
    include: ["**/*.integration.test.{ts,tsx}"],
    testTimeout: 30000, // DBコンテナ起動のため長めに設定
  },
});
```

## 単体テスト

### Usecase のテスト
実装例: src/lib/usecases/__tests__/todos.test.ts
- Vitest での非同期テスト
- Factory パターンでのテストデータ生成
- エラーケースの網羅

```typescript
import { describe, test, expect, beforeEach } from "vitest";
import { createTestDatabase } from "@/test/utils";
import { createTodoUseCase, updateTodoUseCase } from "../todos";
import { todoFactory } from "@/test/factories/todo";
import { userFactory } from "@/test/factories/user";
import { expectFieldValidationError } from "@/test/assertions";

describe("createTodoUseCase", () => {
  let db: ReturnType<typeof createTestDatabase>["db"];
  let userId: string;
  
  beforeEach(async () => {
    const testDb = await createTestDatabase();
    db = testDb.db;
    
    // テストユーザー作成
    const user = await userFactory.create();
    userId = user.id;
  });
  
  test("正常にTODOを作成できる", async () => {
    const input = {
      title: "新しいTODO",
      description: "説明文",
    };
    
    const result = await createTodoUseCase(userId, input);
    
    expect(result).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: expect.any(String),
        title: input.title,
        description: input.description,
        userId,
        completed: false,
      }),
    });
  });
  
  test("重複するタイトルの場合はエラー", async () => {
    // 既存のTODOを作成
    const existingTodo = await todoFactory.create({
      title: "既存のTODO",
      userId,
    });
    
    // 同じタイトルで作成を試みる
    const result = await createTodoUseCase(userId, {
      title: existingTodo.title,
    });
    
    expectFieldValidationError(
      result,
      "title",
      "同じタイトルのTODOが既に存在します"
    );
  });
  
  test("タイトルが空の場合はエラー", async () => {
    const result = await createTodoUseCase(userId, {
      title: "",
    });
    
    expectFieldValidationError(
      result,
      "title",
      "タイトルは必須です"
    );
  });
});
```

### バリデーションテスト
```typescript
import { describe, test, expect } from "vitest";
import { createTodoSchema, updateTodoSchema } from "@/lib/schemas/todo";

describe("createTodoSchema", () => {
  test("有効な入力を受け入れる", () => {
    const validInput = {
      title: "有効なタイトル",
      description: "有効な説明",
    };
    
    const result = createTodoSchema.safeParse(validInput);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });
  
  test("100文字を超えるタイトルを拒否する", () => {
    const invalidInput = {
      title: "a".repeat(101),
    };
    
    const result = createTodoSchema.safeParse(invalidInput);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("100文字以内");
    }
  });
});
```

## 統合テスト

### Server Actions のテスト
実装例: src/lib/actions/__tests__/todos.integration.test.ts
- 実際の DB を使用したテスト
- 認証状態のモック
- E2E に近い動作確認

```typescript
import { describe, test, expect, beforeEach, vi } from "vitest";
import { createIntegrationTestDatabase } from "@/test/utils";
import { createTodoAction, updateTodoAction } from "../todos";
import { auth } from "@/lib/auth";
import { userFactory } from "@/test/factories/user";
import type { User } from "@/db/schema";

// 認証をモック
vi.mock("@/lib/auth");

describe("Server Actions Integration Tests", () => {
  let db: any;
  let container: any;
  let testUser: User;
  
  beforeEach(async () => {
    const testDb = await createIntegrationTestDatabase();
    db = testDb.db;
    container = testDb.container;
    
    // テストユーザーを作成
    testUser = await userFactory.create();
    
    // 認証状態をモック
    vi.mocked(auth).mockResolvedValue({
      user: testUser,
      session: { id: "test-session", userId: testUser.id },
    });
  });
  
  afterEach(async () => {
    await container.stop();
  });
  
  test("createTodoAction - 正常系", async () => {
    const input = {
      title: "統合テストTODO",
      description: "統合テストの説明",
    };
    
    const result = await createTodoAction(input);
    
    expect(result).toMatchObject({
      data: {
        success: true,
        data: expect.objectContaining({
          title: input.title,
          description: input.description,
          userId: testUser.id,
        }),
      },
    });
    
    // DBに実際に保存されているか確認
    const savedTodo = await db.query.todos.findFirst({
      where: (todos, { eq }) => eq(todos.title, input.title),
    });
    
    expect(savedTodo).toBeTruthy();
  });
  
  test("createTodoAction - 認証エラー", async () => {
    // 認証失敗をモック
    vi.mocked(auth).mockResolvedValue({
      user: null,
      session: null,
    });
    
    const result = await createTodoAction({
      title: "失敗するTODO",
    });
    
    expect(result).toMatchObject({
      serverError: expect.stringContaining("認証が必要です"),
    });
  });
});
```

### API ルートのテスト
```typescript
import { describe, test, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import { GET, POST } from "@/app/api/todos/route";
import supertest from "supertest";
import { createTestApp } from "@/test/utils/app";

describe("API Routes", () => {
  let app: any;
  
  beforeEach(async () => {
    app = await createTestApp();
  });
  
  test("GET /api/todos - 認証あり", async () => {
    const response = await supertest(app)
      .get("/api/todos")
      .set("Authorization", "Bearer test-token")
      .expect(200);
    
    expect(response.body).toMatchObject({
      todos: expect.any(Array),
    });
  });
  
  test("POST /api/todos - TODO作成", async () => {
    const newTodo = {
      title: "APIテストTODO",
      description: "APIから作成",
    };
    
    const response = await supertest(app)
      .post("/api/todos")
      .set("Authorization", "Bearer test-token")
      .send(newTodo)
      .expect(201);
    
    expect(response.body).toMatchObject({
      todo: expect.objectContaining(newTodo),
    });
  });
});
```

## モック戦略

### MSW での API モック
実装例: src/test/mocks/
- ネットワークレベルでのモック
- 開発環境でも使用可能

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // 外部APIのモック
  http.get("https://api.example.com/user/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "Test User",
      email: "test@example.com",
    });
  }),
  
  // Supabase Storageのモック
  http.post("*/storage/v1/object/*", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");
    
    return HttpResponse.json({
      Key: `uploads/test-${Date.now()}.jpg`,
    });
  }),
];

// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### Supabase クライアントのモック
```typescript
// src/test/mocks/supabase.ts
import { vi } from "vitest";

export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }),
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  })),
};

// テストでの使用
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

### 認証状態のモック
```typescript
// src/test/mocks/auth.ts
import { vi } from "vitest";
import type { User, Session } from "@/lib/auth/types";

export function mockAuthState(user: Partial<User> | null = null) {
  const mockUser = user ? {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    ...user,
  } : null;
  
  const mockSession = mockUser ? {
    id: "test-session-id",
    userId: mockUser.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  } : null;
  
  vi.mocked(auth).mockResolvedValue({
    user: mockUser,
    session: mockSession,
  });
  
  return { user: mockUser, session: mockSession };
}

// 使用例
test("認証済みユーザーのテスト", async () => {
  mockAuthState({ id: "user-123", email: "user@example.com" });
  
  // テスト実行...
});
```

## テストユーティリティ

### Factory パターン
実装例: src/test/factories/
- fishery でのテストデータ生成
- リアルなデータ構造
- 関連データの自動生成

```typescript
// src/test/factories/todo.ts
import { Factory } from "fishery";
import type { Todo } from "@/db/schema";
import { faker } from "@faker-js/faker";

export const todoFactory = Factory.define<Todo>(() => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  completed: faker.datatype.boolean(),
  userId: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}));

// src/test/factories/user.ts
export const userFactory = Factory.define<User>(() => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  image: faker.image.avatar(),
  emailVerified: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
}));

// 関連データの生成
export const userWithTodosFactory = Factory.define<UserWithTodos>(() => {
  const user = userFactory.build();
  const todos = todoFactory.buildList(5, { userId: user.id });
  
  return { ...user, todos };
});
```

### カスタムアサーション
```typescript
// src/test/assertions.ts
import { expect } from "vitest";

export function expectFieldValidationError(
  result: unknown,
  field: string,
  expectedError: string
) {
  expect(result).toMatchObject({
    validationErrors: {
      [field]: {
        _errors: expect.arrayContaining([expectedError]),
      },
    },
  });
}

export function expectServerError(result: unknown, message: string) {
  expect(result).toMatchObject({
    serverError: expect.stringContaining(message),
  });
}

export function expectSuccess<T>(
  result: unknown
): asserts result is { success: true; data: T } {
  expect(result).toMatchObject({
    success: true,
    data: expect.any(Object),
  });
}
```

### テストヘルパー
```typescript
// src/test/helpers.ts
import { db } from "@/db";
import { todos, users } from "@/db/schema";

export async function cleanupDatabase() {
  // テーブルの順番に注意（外部キー制約）
  await db.delete(todos);
  await db.delete(users);
}

export async function seedTestData() {
  // テスト用の基本データを投入
  const testUsers = await db.insert(users).values([
    { id: "user-1", email: "user1@test.com", name: "User 1" },
    { id: "user-2", email: "user2@test.com", name: "User 2" },
  ]).returning();
  
  const testTodos = await db.insert(todos).values([
    { title: "Test TODO 1", userId: "user-1" },
    { title: "Test TODO 2", userId: "user-1", completed: true },
  ]).returning();
  
  return { users: testUsers, todos: testTodos };
}
```

## テスト実行戦略

### 並列実行
```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    // テストファイルを並列実行
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // 各テストファイル内のテストは順次実行
    sequence: {
      concurrent: false,
    },
  },
});
```

### カバレッジ
```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest --coverage --ui"
  }
}
```

```typescript
// vitest.config.mts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### CI/CD 統合
```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

## テストのベストプラクティス

### AAA パターン
```typescript
test("TODO を完了状態に更新できる", async () => {
  // Arrange（準備）
  const todo = await todoFactory.create({
    completed: false,
    userId: testUser.id,
  });
  
  // Act（実行）
  const result = await updateTodoUseCase(
    testUser.id,
    todo.id,
    { completed: true }
  );
  
  // Assert（検証）
  expectSuccess(result);
  expect(result.data.completed).toBe(true);
});
```

### テストの独立性
```typescript
describe("TODOのCRUD", () => {
  let db: any;
  
  // 各テストの前に新しいDBを作成
  beforeEach(async () => {
    db = await createTestDatabase();
  });
  
  // 各テストの後にクリーンアップ
  afterEach(async () => {
    await db.close();
  });
  
  // テストは他のテストに依存しない
  test("作成", async () => { /* ... */ });
  test("更新", async () => { /* ... */ });
  test("削除", async () => { /* ... */ });
});
```

### エラーケースの網羅
```typescript
describe("エラーハンドリング", () => {
  test.each([
    ["", "タイトルは必須です"],
    ["a".repeat(101), "タイトルは100文字以内で入力してください"],
    ["<script>alert('XSS')</script>", "使用できない文字が含まれています"],
  ])("無効なタイトル「%s」の場合、「%s」エラー", async (title, expectedError) => {
    const result = await createTodoUseCase(userId, { title });
    
    expectFieldValidationError(result, "title", expectedError);
  });
});
```