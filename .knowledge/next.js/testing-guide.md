# Next.js 15 App Router + Supabase 完全テストガイド

## 概要

このガイドは、Next.js 15 App Router + Supabaseプロジェクトにおけるテスト実装の完全ガイドです。データ整合性からUIテストまで、すべてのテスト戦略を網羅しています。

## 基本方針

上司方針: **「バックエンド処理の整合性が最優先、その後でUIのテスト」**

### テスト戦略の全体像

```
1. データ整合性テスト（最優先）
   ├── Mutation層テスト（Vitest + モック）
   ├── Server Actions層テスト（Vitest + モック）
   └── RLS・データベーステスト（pgTAP + ローカルSupabase）

2. 統合テスト（高優先）
   ├── ローカルSupabase統合テスト
   └── エンドツーエンド整合性テスト

3. UIテスト（中優先）
   ├── Container Componentテスト（Vitest）
   ├── Presentational Componentテスト（React Testing Library）
   └── Critical User Path E2E（Playwright）
```

## 2025年推奨テストツール構成

### 必須ツールスタック

```bash
# 基本テストツール
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event

# E2Eテスト
npm init playwright@latest

# ローカルSupabase（データベーステスト）
npm install -G @supabase/cli

# カバレッジ
npm install -D @vitest/coverage-v8
```

### ツール使い分け

| テスト対象 | ツール | 実行タイミング | 目的 |
|------------|--------|----------------|------|
| **mutations/queries** | Vitest + モック | lefthook | データロジック検証 |
| **Server Actions** | Vitest + モック | lefthook | ビジネスロジック検証 |
| **UI Components** | React Testing Library | lefthook | UI動作検証 |
| **RLS/トリガー** | pgTAP + ローカルSupabase | GitHub Actions | データベース整合性 |
| **統合フロー** | ローカルSupabase | GitHub Actions | エンドツーエンド整合性 |
| **Critical Path** | Playwright | GitHub Actions | ユーザー体験検証 |

## 設定ファイル

### vitest.config.ts（完全版）

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: {
        // データ整合性重視の閾値設定
        functions: 90, // mutations/queries
        branches: 85,  // Server Actions
        lines: 80,     // UI Components
        statements: 80,
      },
      include: [
        'src/lib/mutations/**',
        'src/lib/queries/**',
        'src/lib/actions/**',
        'src/components/**',
        'src/app/**'
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/types.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## package.json scripts（完全版）

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest src/lib --reporter=verbose",
    "test:ui": "vitest src/components src/app --reporter=verbose",
    "test:integration": "vitest src/__tests__/integration",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:db": "supabase test db",
    "test:all": "pnpm test:unit && pnpm test:ui && pnpm test:integration && pnpm test:db && pnpm test:e2e",

    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset"
  }
}
```

## Phase 1: データ整合性テスト（最優先）

### 1.1 Mutation層テスト（Vitest + モック）

データ変更処理の整合性を最優先でテストします。

```typescript
// src/lib/mutations/__tests__/todos.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTodo, updateTodo, deleteTodo, updateTodoWithAuth } from '../todos'

// Supabaseクライアントをモック
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: mockTodo,
      error: null
    })
  })
}))

const mockTodo = {
  id: 'test-id',
  title: 'Test Todo',
  completed: false,
  user_id: 'user-123',
  created_at: '2025-01-01',
  updated_at: '2025-01-01'
}

describe('TODO Mutations - データ整合性', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('createTodo - 正常系: データが正しく作成される', async () => {
    const input = {
      title: 'New Todo',
      completed: false,
      user_id: 'user-123'
    }

    const result = await createTodo(input)

    expect(result).toEqual(mockTodo)
    expect(result.user_id).toBe(input.user_id) // 認可チェック
  })

  test('createTodo - 異常系: 必須フィールド不足でエラー', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'validation failed' }
            })
          })
        })
      })
    })

    await expect(createTodo({
      title: '',  // 必須フィールドが空
      user_id: 'user-123',
      completed: false
    })).rejects.toThrow('Failed to create todo')
  })

  test('updateTodoWithAuth - 認可チェック: 所有者以外はアクセス拒否', async () => {
    const mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { user_id: 'other-user' }, // 異なるユーザー
        error: null
      })
    }
    vi.mocked(createClient).mockResolvedValueOnce(mockClient)

    await expect(updateTodoWithAuth(
      'todo-123',
      'user-123', // リクエストユーザー
      { title: 'Updated' }
    )).rejects.toThrow('Unauthorized')
  })

  test('データ整合性: 更新時にupdated_atが変更される', async () => {
    const originalDate = '2025-01-01'
    const updatedDate = '2025-01-02'

    const mockClient = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          ...mockTodo,
          updated_at: updatedDate
        },
        error: null
      })
    }

    vi.mocked(createClient).mockResolvedValueOnce(mockClient)

    const result = await updateTodo('todo-123', { title: 'Updated Title' })

    expect(result.updated_at).toBe(updatedDate)
    expect(result.updated_at).not.toBe(originalDate)
  })
})
```

### 1.2 Server Actions層テスト（Vitest + モック）

ビジネスロジックとキャッシュ無効化を検証します。

```typescript
// src/lib/actions/__tests__/todos.test.ts
import { describe, test, expect, vi } from 'vitest'
import { createTodoAction, updateTodoAction } from '../todos'
import { revalidateTag, revalidatePath } from 'next/cache'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn()
}))

vi.mock('@/lib/mutations/todos', () => ({
  createTodo: vi.fn().mockResolvedValue({
    id: 'new-todo',
    title: 'New Todo',
    user_id: 'user-123'
  })
}))

describe('TODO Actions - ビジネスロジック', () => {
  test('createTodoAction - キャッシュ無効化が正しく実行される', async () => {
    const mockAction = vi.fn().mockImplementation(async ({ parsedInput, ctx }) => {
      const { title } = parsedInput
      const { userId } = ctx

      await createTodo({
        title,
        user_id: userId,
        completed: false
      })

      // キャッシュ無効化
      revalidateTag(`todos-user-${userId}`)
      revalidateTag('todos-all')
    })

    // next-safe-actionのモック設定は複雑なため、実際の実装では
    // action内部のロジックを直接テストする
    await mockAction({
      parsedInput: { title: 'Test Todo' },
      ctx: { userId: 'user-123' }
    })

    expect(revalidateTag).toHaveBeenCalledWith('todos-user-user-123')
    expect(revalidateTag).toHaveBeenCalledWith('todos-all')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  test('エラー時の日本語メッセージ変換', async () => {
    vi.mocked(createTodo).mockRejectedValueOnce(new Error('Database connection failed'))

    // エラー翻訳ロジックのテスト
    const translateError = (error: Error) => {
      if (error.message.includes('Database')) {
        return 'データベースへの接続に失敗しました'
      }
      return 'エラーが発生しました'
    }

    const error = new Error('Database connection failed')
    const translatedMessage = translateError(error)

    expect(translatedMessage).toBe('データベースへの接続に失敗しました')
  })
})
```

## Phase 2: 統合テスト（高優先）

### 2.1 ローカルSupabase統合テスト

実際のデータベースとの統合をテストします。

```typescript
// src/__tests__/integration/todo-integration.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'

describe('TODO統合テスト - ローカルSupabase', () => {
  let testUserId: string
  let supabase: any

  beforeEach(async () => {
    // ユニークなテストユーザーIDを生成
    testUserId = `test-user-${Date.now()}-${Math.random()}`
    supabase = await createClient()

    // テストユーザー作成
    await supabase.auth.admin.createUser({
      email: `${testUserId}@test.com`,
      password: 'test-password',
      user_metadata: { user_id: testUserId }
    })
  })

  test('CRUD操作の完全フロー', async () => {
    // 作成
    const { data: createdTodo, error: createError } = await supabase
      .from('sample_todos')
      .insert({
        title: 'Integration Test Todo',
        user_id: testUserId,
        completed: false
      })
      .select()
      .single()

    expect(createError).toBeNull()
    expect(createdTodo.title).toBe('Integration Test Todo')

    // 読み取り
    const { data: todos, error: readError } = await supabase
      .from('sample_todos')
      .select('*')
      .eq('user_id', testUserId)

    expect(readError).toBeNull()
    expect(todos).toHaveLength(1)

    // 更新
    const { data: updatedTodo, error: updateError } = await supabase
      .from('sample_todos')
      .update({ completed: true })
      .eq('id', createdTodo.id)
      .select()
      .single()

    expect(updateError).toBeNull()
    expect(updatedTodo.completed).toBe(true)

    // 削除
    const { error: deleteError } = await supabase
      .from('sample_todos')
      .delete()
      .eq('id', createdTodo.id)

    expect(deleteError).toBeNull()

    // 削除確認
    const { data: deletedTodos } = await supabase
      .from('sample_todos')
      .select('*')
      .eq('id', createdTodo.id)

    expect(deletedTodos).toHaveLength(0)
  })

  test('RLS（Row Level Security）の動作確認', async () => {
    const otherUserId = `other-user-${Date.now()}`

    // testUserIdでTODO作成
    const { data: todo } = await supabase
      .from('sample_todos')
      .insert({
        title: 'Private Todo',
        user_id: testUserId,
        completed: false
      })
      .select()
      .single()

    // 他のユーザーとしてアクセス試行（RLSで拒否されるはず）
    const { data: unauthorizedAccess } = await supabase
      .from('sample_todos')
      .select('*')
      .eq('id', todo.id)
      // 実際のRLSテストでは認証状態を変更する必要があります

    // RLSが正しく動作していれば、他のユーザーのデータは見えない
    expect(unauthorizedAccess).toHaveLength(0)
  })

  afterEach(async () => {
    // テストデータクリーンアップ
    await supabase
      .from('sample_todos')
      .delete()
      .eq('user_id', testUserId)

    await supabase.auth.admin.deleteUser(testUserId)
  })
})
```

### 2.2 データベーステスト（pgTAP）

```sql
-- supabase/tests/todos_test.sql
BEGIN;

SELECT plan(8);

-- テーブル存在確認
SELECT has_table('public', 'sample_todos', 'sample_todos table should exist');

-- カラム存在確認
SELECT has_column('public', 'sample_todos', 'id', 'id column should exist');
SELECT has_column('public', 'sample_todos', 'title', 'title column should exist');
SELECT has_column('public', 'sample_todos', 'user_id', 'user_id column should exist');

-- 外部キー制約確認
SELECT has_fk('public', 'sample_todos', 'Foreign key constraint should exist');

-- RLSポリシー確認
SELECT policies_are('public', 'sample_todos',
  ARRAY['Users can view own todos', 'Users can insert own todos', 'Users can update own todos', 'Users can delete own todos'],
  'Correct RLS policies should exist');

-- トリガー確認
SELECT has_trigger('public', 'sample_todos', 'update_sample_todos_updated_at', 'updated_at trigger should exist');

-- インデックス確認
SELECT has_index('public', 'sample_todos', 'idx_sample_todos_user_id', 'user_id index should exist');

SELECT * FROM finish();
ROLLBACK;
```

## Phase 3: UIテスト（中優先）

### 3.1 Container Component（Server Component）のテスト

⚠️ **重要**: Vitestは非同期Server Componentsをサポートしていません。
- **同期Server Components**: Vitestでテスト可能
- **非同期Server Components**: PlaywrightでのE2Eテストを推奨

```typescript
// 同期Server Componentのテスト例
const result = await TodoListContainer();
expect(result.type).toBe(TodoListPresentation);
expect(result.props).toEqual({ todos: mockTodos });
```

**理由**: Server ComponentはRSCペイロードを返すため、通常のレンダリングテストは不可能。関数として実行し、適切なPropsが渡されているかを検証する。

### Presentational Componentのテスト

純粋なPropsベースのUIコンポーネントとしてテスト。

```typescript
render(<TodoListPresentation todos={todos} />);
// ユーザー視点でのテスト
expect(screen.getByText('タスク1')).toBeInTheDocument();
```

## モッキング戦略

### モック変数の宣言パターン

モジュールレベルでモック変数を宣言し、beforeEachでリセットする。

```typescript
// モジュールレベルで宣言
let mockHandleSubmitWithAction = vi.fn();
let mockResetFormAndAction = vi.fn();
let mockForm = {
  register: vi.fn((name) => ({ name })), // nameオブジェクトを返す
  handleSubmit: vi.fn(),
  formState: { errors: {}, isSubmitting: false },
  control: {} as any,
};

// beforeEachでリセット
beforeEach(() => {
  vi.clearAllMocks();
  // モック実装をリセット
  mockHandleSubmitWithAction = vi.fn();
  mockResetFormAndAction = vi.fn();
  mockForm = { /* 上記と同じ */ };
});
```

**理由**: テスト間の干渉を防ぎ、各テストが独立して実行される。

### 動的モック実装パターン

```typescript
const mockUseHookFormAction = vi.fn();

vi.mock('@next-safe-action/adapter-react-hook-form/hooks', () => ({
  useHookFormAction: (...args: unknown[]) => mockUseHookFormAction(...args),
}));
```

### Query/Mutationレベルでモック

```typescript
// ✅ 正しい: Query/Mutation関数をモック
vi.mock('@/lib/queries/todos', () => ({
  getTodosByUserId: vi.fn(),
}));

// ❌ 間違い: Supabaseクライアントを直接モック
vi.mock('@/lib/supabase/server');
```

**理由**: データフェッチングロジックとビジネスロジックを分離。Supabaseの実装詳細に依存しない。

### グローバルモック（src/test/setup.ts）

```typescript
// モック関数を外部で定義（テストからアクセス可能）
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockPrefetch = vi.fn();
const mockBack = vi.fn();
const mockForward = vi.fn();
const mockRefresh = vi.fn();

// Next.js Navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test',
  redirect: vi.fn(),
}));

// 環境変数（実際の構造に準拠）
vi.mock('@/app/env.mjs', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  },
}));
```

## Server Action/Formテスト

### useHookFormActionのモック

```typescript
const mockUseHookFormAction = vi.mocked(useHookFormAction);

// 成功ケース
mockUseHookFormAction.mockImplementation(
  (
    _action: unknown,
    _resolver: unknown,
    options: { actionProps: { onSuccess: () => void } },
  ) => {
    const handleSubmitWithAction = vi.fn((e) => {
      e?.preventDefault();
      options.actionProps.onSuccess();
    });
    return {
      form: mockForm,
      action: { status: 'idle' }, // アクションステータス
      handleSubmitWithAction,
      resetFormAndAction: mockResetFormAndAction,
    };
  }
);

// エラーケース
mockUseHookFormAction.mockImplementation(
  (
    _action: unknown,
    _resolver: unknown,
    options: { actionProps: { onError: (error: unknown) => void } },
  ) => {
    const handleSubmitWithAction = vi.fn((e) => {
      e?.preventDefault();
      options.actionProps.onError({ error: { serverError: 'エラーメッセージ' } });
    });
    return {
      form: mockForm,
      action: { status: 'idle' },
      handleSubmitWithAction,
      resetFormAndAction: mockResetFormAndAction,
    };
  }
);
```

**重要**:
- onNavigationコールバックはナビゲーションアクション用。通常のフォームはonSuccess/onErrorを使用
- アクションステータス: `'idle'`（通常）、`'executing'`（実行中）

### フォームバリデーションエラー

```typescript
const mockForm = {
  register: vi.fn(),
  handleSubmit: vi.fn(),
  formState: {
    errors: {
      title: { message: 'タイトルは必須です' }
    },
    isSubmitting: false
  },
  control: {} as any,
};
```

## 非同期コンポーネントのテスト

### Container Componentのテストパターン

```typescript
// 動的importでモックされたモジュールを取得
const { getCurrentUser } = await import('@/lib/queries/users');
const { getTodosByUserId } = await import('@/lib/queries/todos');

// モックの設定
vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-123' });
vi.mocked(getTodosByUserId).mockResolvedValue(mockTodos);

// Container Componentを非同期関数として実行
const result = await TodoListContainer();
```

### エラーバウンダリのテスト

```typescript
// Container Componentでエラーをthrow
vi.mocked(getTodosByUserId).mockRejectedValue(new Error('データ取得エラー'));

// error.tsxがキャッチすることを前提にテスト
await expect(TodoListContainer()).rejects.toThrow('データ取得エラー');
```

### Loading状態のテスト

```typescript
// フォーム送信中
const mockForm = {
  formState: { isSubmitting: true }
};

render(<AddTodoForm />);
expect(screen.getByRole('button')).toBeDisabled();
expect(screen.getByText('追加中...')).toBeInTheDocument();

// アクション実行中
mockUseHookFormAction.mockReturnValue({
  form: mockForm,
  action: { status: 'executing' }, // 実行中ステータス
  handleSubmitWithAction: mockHandleSubmitWithAction,
});
```

## テストファイル構成

```
component-directory/
├── container.tsx        # Server Component
├── presentational.tsx   # Client Component
├── index.tsx           # Export
└── __tests__/
    ├── container.test.ts      # Container tests
    └── presentational.test.tsx # UI tests
```

## ユーザビリティテスト

### ユーザーインタラクション

```typescript
import { userEvent } from '@testing-library/user-event';

const user = userEvent.setup();

// フォーム入力
await user.type(screen.getByLabelText('タイトル'), 'New TODO');
await user.click(screen.getByRole('button', { name: '追加' }));

// 結果の検証
expect(mockHandleSubmit).toHaveBeenCalled();
```

### パスワード表示切り替えテスト

```typescript
// 単一パスワードフィールド
const passwordInput = screen.getByLabelText('パスワード');
const toggleButton = screen.getByRole('button', { name: /パスワードを表示/ });

expect(passwordInput).toHaveAttribute('type', 'password');
await user.click(toggleButton);
expect(passwordInput).toHaveAttribute('type', 'text');
expect(screen.getByRole('button', { name: /パスワードを非表示/ })).toBeInTheDocument();

// 複数パスワードフィールド（サインアップフォームなど）
const toggleButtons = screen.getAllByRole('button', { name: /パスワードを表示/ });
await user.click(toggleButtons[0]); // 最初のパスワードフィールド
await user.click(toggleButtons[1]); // 確認用パスワードフィールド
```

### アクセシビリティ

```typescript
// ラベルとの関連付け
expect(screen.getByLabelText('タイトル')).toBeInTheDocument();

// ARIA属性
expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();

// 複数のCSSクラスの検証
expect(element).toHaveClass('line-through', 'text-muted-foreground');
```

## Toast通知のテスト

```typescript
import { toast } from 'sonner';

// 成功時
expect(toast.success).toHaveBeenCalledWith('TODOを追加しました');

// エラー時
expect(toast.error).toHaveBeenCalledWith('追加に失敗しました');
```

## FormErrorコンポーネントのテスト

```typescript
// 特殊なエラータイプの処理
it('renders custom message for "Required" error type', () => {
  const error: FieldError = {
    type: 'required',
    message: 'Required',
  };
  render(<FormError error={error} label="メールアドレス" />);
  // "Required"メッセージは日本語に変換される
  expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument();
});
```

## 2025年推奨テストツール構成

### UIテスト用ツールスタック

- **Vitest**: Jest比で高速、HMRライクなテスト再実行
- **React Testing Library**: ユーザー視点でのテスト
- **@testing-library/user-event**: ユーザーインタラクション
- **@testing-library/jest-dom**: DOM拡張マッチャー

### セットアップ（2025年版）

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

### vitest.config.ts（推奨設定）

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: {
        functions: 80,
        branches: 75,
        lines: 80,
        statements: 80,
      },
      include: ['src/components/**', 'src/app/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/types.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

## テスト実行コマンド（2025年版）

```bash
# 単体・UIテスト（高速、lefthook用）
pnpm test:unit

# 全テスト実行
pnpm test

# ウォッチモード（開発時）
pnpm test:watch

# カバレッジ（CI用）
pnpm test:coverage

# UI付きテスト（デバッグ用）
pnpm test:ui

# 特定ディレクトリ
pnpm test src/app/dashboard/__tests__/

# 統合テスト（重い、GitHub Actions用）
pnpm test:integration

# E2Eテスト（最も重い、GitHub Actions用）
pnpm test:e2e
```

## テスト優先順位（2025年版）

上司方針: **「バックエンド処理の整合性が最優先、その後でUIのテスト」**

### 1. データ整合性テスト（最優先）
- [ ] mutations関数のテスト（データ変更の整合性）
- [ ] queries関数のテスト（データ取得の正確性）
- [ ] Server Actionsのテスト（ビジネスロジック検証）

### 2. UIテスト（このガイドの範囲）
- [ ] Container ComponentはServer Componentとして非同期関数でテスト
- [ ] Presentational ComponentはUIとユーザーインタラクションをテスト
- [ ] フォームは成功・エラー・バリデーションの全ケースをテスト

### 3. 品質確保
- [ ] モックはQuery/Mutationレベルで実装（Supabaseを直接モックしない）
- [ ] Loading状態とdisabled状態を適切にテスト
- [ ] Toast通知の表示を検証
- [ ] 日本語のエラーメッセージが正しく表示されることを確認
- [ ] useHookFormActionのonSuccess/onError/onNavigationを正しく使い分け
- [ ] アクセシビリティ（ラベル、ARIA属性）を考慮
- [ ] テストファイルは__tests__ディレクトリに配置

### 3.2 E2Eテスト（Playwright）

Critical User Pathの完全なテストを実行します。

```typescript
// e2e/auth-todo-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('認証からTODO操作の完全フロー', () => {
  test('サインアップ → ログイン → TODO操作 → ログアウト', async ({ page }) => {
    // サインアップ
    await page.goto('/auth/sign-up')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="sign-up-button"]')

    // ダッシュボードへリダイレクト確認
    await expect(page).toHaveURL('/dashboard/mypage')

    // TODO作成
    await page.fill('[data-testid="todo-title"]', 'E2E Test Todo')
    await page.click('[data-testid="add-todo-button"]')

    // 作成されたTODOの確認
    await expect(page.locator('[data-testid="todo-item"]')).toContainText('E2E Test Todo')

    // TODO完了
    await page.click('[data-testid="todo-checkbox"]')
    await expect(page.locator('[data-testid="todo-item"]')).toHaveClass(/line-through/)

    // TODO削除
    await page.click('[data-testid="delete-todo-button"]')
    await expect(page.locator('[data-testid="todo-item"]')).not.toBeVisible()

    // ログアウト
    await page.click('[data-testid="logout-button"]')
    await expect(page).toHaveURL('/auth/sign-in')
  })

  test('非同期Server Componentsのテスト', async ({ page }) => {
    // 認証後にダッシュボード表示
    await page.goto('/dashboard/mypage')

    // 非同期でロードされるTODOリストの確認
    await expect(page.locator('[data-testid="todo-list"]')).toBeVisible()

    // Loading状態からデータ表示への遷移確認
    await expect(page.locator('[data-testid="loading"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="todo-items"]')).toBeVisible()
  })

  test('エラー状態のテスト', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/**', route => route.abort())

    await page.goto('/dashboard/mypage')

    // エラー状態の確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('エラーが発生しました')
  })
})
```

## 実行戦略（lefthook + GitHub Actions）

### lefthook設定（.lefthook.yml）

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{js,ts,tsx}"
      run: pnpm biome check --write {staged_files}

    unit-tests:
      glob: "src/lib/**/*.{ts,tsx}"
      run: pnpm test:unit --run --reporter=basic

    ui-tests:
      glob: "src/{components,app}/**/*.{ts,tsx}"
      run: pnpm test:ui --run --reporter=basic

    type-check:
      glob: "src/**/*.{ts,tsx}"
      run: pnpm typecheck

pre-push:
  commands:
    security-audit:
      run: pnpm audit --audit-level high
```

### GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Comprehensive Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:ui

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: |
          supabase start
          supabase test db
          pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: npx playwright install
      - run: pnpm build
      - run: pnpm test:e2e

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

## 品質指標とメトリクス

### カバレッジ目標

- **mutations/queries**: 90%以上（データ整合性重視）
- **Server Actions**: 85%以上（ビジネスロジック）
- **UI Components**: 80%以上（ユーザー体験）

### 実行時間目標

- **lefthook（commit時）**: 30秒以内
- **GitHub Actions全体**: 10分以内

### 品質ゲート

- [ ] 全単体テスト通過
- [ ] カバレッジ閾値達成
- [ ] データベーステスト通過
- [ ] E2E Critical Path通過
- [ ] セキュリティ監査クリア

## 実装チェックリスト

### Phase 1: データ整合性テスト（最優先）
- [ ] mutations層テスト（createTodo, updateTodo, deleteTodo）
- [ ] queries層テスト（getTodosByUserId, getTodoById）
- [ ] Server Actions層テスト（キャッシュ無効化、エラーハンドリング）
- [ ] 認可テスト（所有者チェック、RLS）

### Phase 2: 統合テスト（高優先）
- [ ] ローカルSupabaseセットアップ
- [ ] CRUD操作の完全フロー
- [ ] RLS動作確認
- [ ] pgTAPデータベーステスト

### Phase 3: UIテスト（中優先）
- [ ] Container Componentテスト
- [ ] Presentational Componentテスト
- [ ] フォームテスト（成功・エラー・バリデーション）
- [ ] Critical User Path E2E

### Phase 4: 継続的品質改善
- [ ] カバレッジ監視
- [ ] パフォーマンス監視
- [ ] エラー率監視
- [ ] 自動化品質チェック

## トラブルシューティング

### よくある問題と解決策

1. **Vitestで非同期Server Components**
   - 解決: PlaywrightでのE2Eテストに移行

2. **ローカルSupabaseのポート競合**
   - 解決: `supabase/config.toml`でポート変更

3. **テスト間のデータ汚染**
   - 解決: ユニークID戦略使用

4. **MSWでのServer Components**
   - 解決: Next.js 15で改善、実際のローカルSupabaseを推奨

5. **テスト実行時間の長さ**
   - 解決: 軽量テストはlefthook、重いテストはGitHub Actionsで分離

## まとめ

このガイドに従うことで：

1. **データ整合性を最優先**とした堅牢なテスト環境
2. **段階的な実装**による継続的な品質向上
3. **2025年の最新技術**を活用した効率的なテスト
4. **lefthook + GitHub Actions**による最適化された実行戦略

を実現できます。データの不整合を防ぎ、高品質なNext.js 15 + Supabaseアプリケーションを構築することが可能になります。
