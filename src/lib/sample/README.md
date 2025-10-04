# サンプル実装コード (lib/sample)

このディレクトリには、レイヤードアーキテクチャのベストプラクティスを示すサンプル実装が含まれています。

## 📁 構成

```
sample/
├── actions/          # Server Actions層
│   ├── todos.ts
│   └── diary.ts
├── usecases/         # ビジネスロジック層
│   ├── todos.ts
│   ├── diary.ts
│   └── __tests__/
├── mutations/        # データ書き込み層
│   ├── todos.ts
│   ├── diaries.ts
│   └── __tests__/
├── queries/          # データ読み込み層
│   ├── todos.ts
│   ├── diaries.ts
│   └── __tests__/
├── domain/           # ドメインモデル層
│   ├── todos/
│   └── diary/
└── schemas/          # バリデーションスキーマ層
    ├── todos.ts
    └── diary.ts
```

## 🎯 含まれるパターン

### レイヤードアーキテクチャ

**データフロー:**
```
Client Component
  ↓ (Server Action呼び出し)
actions/
  ↓ (ビジネスロジック委譲)
usecases/
  ↓ (データアクセス)
mutations/ or queries/
  ↓ (DB操作)
Drizzle ORM
```

**各層の責務:**

- **actions/** - next-safe-actionによる型安全なServer Actions
- **usecases/** - ビジネスルール、バリデーション、権限チェック
- **mutations/** - データ書き込み、トランザクション制御
- **queries/** - データ読み込み、キャッシュ制御
- **domain/** - ドメインモデル、定数、バリデータ
- **schemas/** - Zodスキーマ、フォームバリデーション

### 実装パターン

#### ✅ Server Actions (next-safe-action)

```typescript
// actions/todos.ts
export const createTodoAction = privateActionClient
  .metadata({ actionName: 'createTodo' })
  .inputSchema(createTodoFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    await createTodoUsecase(parsedInput, { userId });
    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });
```

#### ✅ ビジネスロジック分離

```typescript
// usecases/todos.ts
export async function createTodoUsecase(
  input: CreateTodoInput,
  context: UsecaseContext,
) {
  // バリデーション
  if (!isValidTodoTitle(input.title)) {
    return returnValidationErrors(createTodoFormSchema, {
      title: { _errors: [TODO_MESSAGES.INVALID_TITLE] },
    });
  }

  // 重複チェック
  const existingTodo = await getTodoByUserIdAndTitle(
    context.userId,
    input.title,
  );
  if (existingTodo) {
    return returnValidationErrors(createTodoFormSchema, {
      title: { _errors: [TODO_MESSAGES.DUPLICATE_TITLE] },
    });
  }

  // データ作成
  return await createTodo({
    userId: context.userId,
    title: input.title,
  });
}
```

#### ✅ キャッシュ戦略

```typescript
// queries/todos.ts
export function getTodosByUserId(userId: string) {
  return unstable_cache(
    async (): Promise<Todo[]> => {
      return await db.query.todos.findMany({
        where: eq(todos.userId, userId),
        orderBy: [desc(todos.createdAt)],
      });
    },
    [CACHE_KEYS.TODOS.USER(userId)],
    { tags: [CACHE_TAGS.TODOS.USER(userId)] },
  )();
}
```

#### ✅ ドメインモデル

```typescript
// domain/todos/models.ts
export class TodoAccessDeniedError extends Error {
  constructor(message = TODO_MESSAGES.ACCESS_DENIED) {
    super(message);
    this.name = 'TodoAccessDeniedError';
  }
}

export function canAccessTodo(todo: Todo, userId: string): boolean {
  return todo.userId === userId;
}
```

#### ✅ 統合テスト

```typescript
// usecases/__tests__/todos.integration.test.ts
describe('createTodoUsecase', () => {
  it('有効なTODOを作成できる', async () => {
    const user = await createTestUser(userFactory.build());
    const input = { title: 'テストタスク' };

    const result = await createTodoUsecase(input, { userId: user.id });

    expect(result.title).toBe('テストタスク');
    expect(result.userId).toBe(user.id);
  });
});
```

## 🚀 使い方

### 新機能実装時の参考

新しい機能を実装する際は、このサンプルのパターンを参考にしてください:

```typescript
// 1. Zodスキーマ定義 (lib/schemas/)
export const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
});

// 2. Mutations定義 (lib/mutations/)
export async function createPost(data: PostInsert) {
  return await db.insert(posts).values(data).returning();
}

// 3. Queries定義 (lib/queries/)
export function getPostsByUserId(userId: string) {
  return unstable_cache(
    async () => db.query.posts.findMany({ where: eq(posts.userId, userId) }),
    [CACHE_KEYS.POSTS.USER(userId)],
    { tags: [CACHE_TAGS.POSTS.USER(userId)] },
  )();
}

// 4. Usecase定義 (lib/usecases/)
export async function createPostUsecase(
  input: CreatePostInput,
  context: UsecaseContext,
) {
  // ビジネスロジック
  return await createPost({ ...input, userId: context.userId });
}

// 5. Server Action定義 (lib/actions/)
export const createPostAction = privateActionClient
  .inputSchema(createPostSchema)
  .action(async ({ parsedInput, ctx }) => {
    await createPostUsecase(parsedInput, { userId: ctx.userId });
    revalidateTag(CACHE_TAGS.POSTS.USER(ctx.userId));
  });
```

### レイヤー間の依存ルール

```
actions → usecases → mutations/queries → DB
         ↓
       domain
         ↓
       schemas
```

**禁止事項:**
- ❌ actions から直接 mutations/queries を呼び出す
- ❌ 下位層から上位層への依存
- ❌ レイヤーのスキップ

## 🗑️ 削除方法

テンプレートから実装を開始する際は:

```bash
# サンプルコード削除
rm -rf src/lib/sample

# 対応するルートも削除
rm -rf src/app/(sample)
rm -rf src/components/sample
```

## 📚 参照すべきファイル

| パターン | ファイル |
|---------|---------|
| Server Action | `actions/todos.ts` |
| ビジネスロジック | `usecases/todos.ts` |
| データ読み込み | `queries/todos.ts` |
| データ書き込み | `mutations/todos.ts` |
| ドメインモデル | `domain/todos/models.ts` |
| バリデーション | `domain/todos/validators.ts` |
| スキーマ定義 | `schemas/todos.ts` |
| 統合テスト | `usecases/__tests__/todos.integration.test.ts` |

## 🔗 関連

- サンプルルート: `src/app/(sample)/`
- サンプルコンポーネント: `src/components/sample/`
- 共通インフラ層: `src/lib/utils/`, `src/lib/services/`, `src/lib/storage/`

## ⚠️ 注意事項

- このディレクトリは **参照用** です
- 新規実装は `src/lib/` 直下に作成してください
- 認証関連 (`lib/actions/auth.ts` 等) は共通機能として `lib/` に残されています
