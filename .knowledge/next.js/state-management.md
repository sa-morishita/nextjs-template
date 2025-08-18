# 状態管理

Next.js App Routerにおける状態管理のパターンと実装方法。

## クライアントサイドのグローバル状態管理

グローバルな状態管理にはZustandを使用。

## Server Actionsによる状態更新

### next-safe-action v8の実装パターン

プロジェクトではnext-safe-action v8を使用してServer Actionsを実装。v8の重要な変更点と実装パターン：

```typescript
// 基本的なアクションクライアント設定
export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  handleServerError(error, utils) {
    // Sentryでエラーを自動記録
    // 日本語エラーメッセージに変換
    return translateError(error);
  },
});

// 認証が必要なアクション用クライアント
export const privateActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { error, data } = await supabase.auth.getUser();

  if (error) {
    throw new Error('認証が確認できませんでした。再度ログインしてください。');
  }

  return next({ ctx: { userId: data.user.id } });
});
```

#### v8の重要な変更点
- `.inputSchema()` を使用（v7の `.schema()` から変更）
- `.metadata({ actionName: 'xxx' })` でアクション名を必ず設定
- `flattenValidationErrors` でバリデーションエラーをフラット化

#### Sentryエラートラッキングの統合
```typescript
// handleServerError内でSentryに詳細情報を記録
Sentry.captureException(error, (scope) => {
  scope.clear();
  scope.setContext('serverError', { message: error.message });
  scope.setContext('metadata', { actionName: metadata?.actionName ?? '' });
  scope.setContext('ctx', { ...ctx });
  scope.setContext('clientInput', { clientInput: clientInput ?? {} });
  scope.setContext('bindArgsClientInputs', {
    bindArgsClientInputs: bindArgsClientInputs ?? [],
  });
  if (error.cause) {
    scope.setContext('cause', { ...error.cause });
  }
  return scope;
});
```

**なぜ重要か**: エラー発生時の完全なコンテキスト（アクション名、入力値、認証情報など）をSentryに記録することで、本番環境でのデバッグとトラブルシューティングが効率化される。

### エラーハンドリング戦略

#### 1. 戻り値パターン（フォーム入力保持）
```typescript
export async function updateTodo(
  id: string,
  _prevState: unknown,
  formData: FormData,
) {
  try {
    // 処理...
    return {
      error: null,
      isSuccess: true,
    };
  } catch (error) {
    return {
      error: 'TODOの更新に失敗しました。もう一度お試しください。',
      isSuccess: false,
    };
  }
}
```

**なぜ重要か**: Server Actionでthrowするとerror.tsxに遷移し、フォーム入力が失われる。戻り値パターンにより、エラー時もユーザーの入力を保持できる。

#### 2. 日本語エラーメッセージの自動変換
- Supabase AuthErrorは自動的に日本語メッセージに変換
- 完全な日本語メッセージ（句読点含む）はそのまま返す
- 技術的なエラーメッセージは汎用的な日本語メッセージに変換

### フォームバリデーション

#### Zodスキーマの二重使用パターン
```typescript
// 1. サーバーサイドでのバリデーション
const action = privateActionClient
  .inputSchema(todoSchema)
  .action(async ({ parsedInput }) => {
    // サーバーサイドで型安全な処理
  });

// 2. クライアントサイドでのバリデーション
const { form, handleSubmitWithAction } = useHookFormAction(
  action,
  zodResolver(todoSchema), // 同じスキーマを使用
  { /* options */ }
);
```

**なぜ重要か**: クライアントとサーバーで同じバリデーションロジックを共有し、一貫性を保証。

### useActionStateによるServer Action状態管理

#### Next.js 15の新しいuseActionStateフック
```typescript
// Server Actionのバインド（非フォーム値をバインド）
const updateTodoWithId = updateTodo.bind(null, params.id);

// useActionStateでServer Actionの状態管理
const [state, formAction, isPending] = useActionState(
  updateTodoWithId,
  undefined, // 初期状態
);

// フォーム内での使用
<form action={formAction}>
  <input name="title" />
  <button disabled={isPending}>保存</button>
  {state?.error && <p>{state.error}</p>}
</form>
```

**なぜ重要か**:
- Server Actionのペンディング状態を自動管理
- エラーハンドリングの簡潔な実装
- プログレッシブエンハンスメント対応（JSなしでも動作）
- `bind()`メソッドで非フォーム値（ID等）を事前バインド

### キャッシュ無効化戦略

#### タグベースの細かいキャッシュ制御
```typescript
// キャッシュタグの設計
// - ユーザー固有: `todos-user-${userId}`
// - リソース固有: `todo-${id}`
// - グローバル: `todos-all`

// 操作別の無効化パターン
// 新規作成時
revalidateTag(`todos-user-${userId}`);
revalidateTag('todos-all');

// 更新時
revalidateTag(`todo-${id}`);
revalidateTag(`todos-user-${userId}`);

// 削除時
revalidateTag(`todo-${id}`);
revalidateTag(`todos-user-${userId}`);
revalidateTag('todos-all');

```

**なぜ重要か**:
- revalidateTag: 細かいキャッシュ制御で高速な部分更新
- revalidatePath: ページ全体の確実な更新
- 両方の併用により、パフォーマンスと確実性のバランスを実現

## URL状態管理（nuqs）

### nuqsによる型安全なURL状態管理

```typescript
// フィルター状態の管理
const [status, setStatus] = useQueryState('status', {
  defaultValue: 'all' as FilterStatus,
  parse: (value): FilterStatus => {
    if (value === 'completed' || value === 'incomplete') {
      return value;
    }
    return 'all';
  },
});

// 検索状態の管理（トランジション付き）
const [search, setSearch] = useQueryState('search', {
  defaultValue: '',
  clearOnDefault: true, // 空文字列の場合はURLから削除
  startTransition, // URLの更新をトランジションでラップ
});
```

**なぜ重要か**:
- ブラウザの戻る/進むボタンが正しく動作
- URLの共有でフィルター状態も共有可能
- リロード時も状態が維持される
- Next.jsのuseSearchParams()より簡潔で型安全

### searchParams props（Promise-based）

```typescript
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  // URLパラメータに基づいた動的なレンダリング
}
```

**なぜ重要か**: Next.js 15ではsearchParamsがPromiseとして提供され、Dynamic IOに対応。

## Cookie状態管理

### セキュアなCookie設定パターン

```typescript
import { cookies } from 'next/headers';

export async function setTheme(theme: string) {
  const cookieStore = await cookies();

  cookieStore.set(THEME_COOKIE_NAME, theme, {
    maxAge: 60 * 60 * 24 * 365, // 1年
    // HTTPSでのみ送信（本番環境）
    secure: process.env.NODE_ENV === 'production',
    // XSS攻撃を防ぐ（JavaScriptからアクセス不可）
    httpOnly: true,
    // CSRF攻撃を防ぐ
    sameSite: 'lax',
    path: '/',
  });
}
```

**なぜ重要か**:
- `secure`: 本番環境でHTTPS通信のみでCookieを送信
- `httpOnly`: XSS攻撃からCookieを保護
- `sameSite`: CSRF攻撃を防御
- 環境に応じた設定の切り替えで開発効率とセキュリティを両立

## Optimistic UIパターン

### useHookFormOptimisticAction

```typescript
const { action } = useHookFormOptimisticAction(
  toggleTodoCompleteAction,
  zodResolver(toggleSchema),
  {
    actionProps: {
      currentState: { todos },
      updateFn: (state, input) => ({
        todos: state.todos.map((t) =>
          t.id === input.id ? { ...t, completed: input.completed } : t,
        ),
      }),
    },
  },
);

// 楽観的状態から現在のTODOを取得
const optimisticTodo = action.optimisticState?.todos.find(
  (t) => t.id === todo.id,
) || todo;
```

**なぜ重要か**:
- サーバー応答前に即座にUIを更新し、体感速度を向上
- 失敗時は自動的に元の状態に復元
- react-hook-formとの統合により、一貫したフォーム処理

## 開発支援パターン

### 開発環境での遅延シミュレーション

```typescript
// utils/delay.ts
export async function simulateDelay(ms: number, label?: string) {
  if (process.env.NODE_ENV === 'development') {
    if (label) {
      console.log(`[Delay Simulation] ${label}: ${ms}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 使用例: Streaming SSRの効果を視覚的に確認
export async function getTodos() {
  await simulateDelay(1000, 'Fetching todos');
  // 実際のデータ取得処理
}
```

**なぜ重要か**:
- Streaming SSRの効果を視覚的に確認
- ローディング状態のテストが容易
- 本番環境では自動的に無効化されるため、パフォーマンスへの影響なし

### デバッグ情報の表示パターン

```typescript
// 開発環境でのURL状態表示
{process.env.NODE_ENV === 'development' && (
  <div className="mt-4 rounded bg-muted p-2 font-mono text-xs">
    <div>Current URL Parameters:</div>
    <div>?status={status}&search={search}</div>
    <div>Optimistic State: {JSON.stringify(action.optimisticState)}</div>
    <div>Pending: {String(isPending)}</div>
  </div>
)}
```

**なぜ重要か**:
- URL状態、楽観的更新、ペンディング状態を可視化
- 開発中のデバッグ効率が大幅に向上
- 本番環境では自動的に非表示

## 実装チェックリスト

### Server Actions実装時
- [ ] next-safe-action v8の `.inputSchema()` を使用
- [ ] `.metadata({ actionName: 'xxx' })` を設定
- [ ] エラーは戻り値で表現（throwしない）
- [ ] 適切なキャッシュタグで `revalidateTag` を実行
- [ ] 認証が必要な場合は `privateActionClient` を使用

### URL状態管理実装時
- [ ] nuqsの `useQueryState` を使用
- [ ] デフォルト値とパーサーを適切に設定
- [ ] `clearOnDefault: true` で不要なパラメータを削除
- [ ] 必要に応じて `startTransition` でラップ

### Optimistic UI実装時
- [ ] `useHookFormOptimisticAction` を使用
- [ ] `currentState` と `updateFn` を正しく設定
- [ ] 楽観的状態から表示用のデータを取得
- [ ] ペンディング中の視覚的フィードバックを実装

### Cookie状態管理実装時
- [ ] `secure`、`httpOnly`、`sameSite` を適切に設定
- [ ] 環境に応じた設定の切り替えを実装
- [ ] 有効期限（maxAge）を用途に応じて設定

### 開発支援実装時
- [ ] `simulateDelay` で遅延をシミュレート（開発環境のみ）
- [ ] デバッグ情報の表示（開発環境のみ）
- [ ] 本番環境での自動無効化を確認
