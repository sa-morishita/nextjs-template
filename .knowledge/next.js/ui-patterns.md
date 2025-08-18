# UI/UXパターン

Next.js App RouterにおけるUI/UX実装パターンの詳細解説。

## Container/Presentationalパターン

データフェッチとUI表示の責務を分離する設計パターン。Next.js App Routerでは、Server ComponentsとClient Componentsの境界設計に活用。

### ディレクトリ構造
```
_containers/
├── todo-list/
│   ├── index.tsx        # Containerのみをexport
│   ├── container.tsx    # データフェッチ（Server Component）
│   ├── presentational.tsx # UI表示（Shared Component）
│   └── __tests__/      # テスト
```

### 実装例
```tsx
// container.tsx - Server Component
export async function TodoListContainer() {
  const todos = await getTodos();
  return <TodoListPresentation todos={todos} />;
}

// presentational.tsx - Shared Component（"use client"なし）
export function TodoListPresentation({ todos }) {
  return <div>{/* UIの実装 */}</div>;
}
```

### なぜこのパターンが重要か
- **テスト容易性**: Presentationalコンポーネントは純粋な関数として単体テスト可能
- **再利用性**: データソースに依存しないUIコンポーネント
- **RSC最適化**: 必要最小限のClient Component化でバンドルサイズを削減

## Shared Componentsパターン

"use client"を付けずに実装し、Server ComponentとしてもClient Componentとしても動作可能なコンポーネント。

### 実装例
```tsx
// Linkコンポーネントを使用してもShared Componentのまま
export function TodoItemPresentation({ todo }: TodoItemPresentationProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <Link href={`/dashboard/todos/${todo.id}`} className="block">
        {/* JavaScriptなしで動作するUI */}
      </Link>
    </Card>
  );
}
```

### Client Component化の判断基準

#### インタラクティブ機能による判断
- イベントハンドラ（onClick、onChange）が必要
- 状態管理（useState、useReducer）が必要
- ブラウザAPIの使用（window、document、localStorage）
- サードパーティライブラリがClient Componentを要求する場合

#### RSC Payload最適化による判断
- **繰り返しレンダリングされるコンポーネント**: リスト内で同じコンポーネントが大量に繰り返される場合
- **大量のTailwindクラスを含む場合**: 特に動的なクラス名やcn()による複雑な条件分岐
- **具体的な基準**: 
  - 50件以上のリストアイテムで使用される
  - 1つのコンポーネントに20個以上のTailwindクラスが含まれる
  - 条件分岐によるクラス名の組み合わせが5パターン以上

```tsx
// Client Component化の例
'use client';

// 大量のTailwindクラスと繰り返しレンダリング
export function TodoItem({ todo }: { todo: Todo }) {
  return (
    <div className={cn(
      "group relative flex items-center gap-3 rounded-lg border p-4",
      "transition-all duration-200 hover:shadow-md",
      "focus-within:ring-2 focus-within:ring-primary",
      todo.completed && "bg-muted opacity-60",
      // ... 多数のクラス
    )}>
      {/* 複雑なUI */}
    </div>
  );
}

## Loading States & Suspense Boundaries

### ページ固有のローディング状態
各ページに最適化されたloading.tsxを配置し、Layout Shiftを最小化。

```tsx
// loading.tsx - ダッシュボード専用スケルトン
export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6">
      {/* 実際のレイアウトと同じ構造でスケルトンを配置 */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Suspense境界の設計
```tsx
// 独立したデータフェッチごとにSuspense境界を設定
<Suspense fallback={<TodoListSkeleton />}>
  <TodoListContainer />
</Suspense>
<Suspense fallback={<TodoSummarySkeleton />}>
  <TodoSummaryContainer />
</Suspense>
```

### なぜ重要か
- **CLS (Cumulative Layout Shift) の改善**: 実際のレイアウトに近いスケルトンでLayout Shiftを防止
- **Dynamic Content**: 動的コンテンツの最適化
- **Progressive Enhancement**: コンテンツが独立してロード可能

## Error Handling UIパターン

### エラー境界の階層
```
app/
├── error.tsx          # アプリケーション全体のエラー
├── (protected)/
│   ├── error.tsx      # 認証済みエリアのエラー
│   └── dashboard/
│       └── todos/
│           └── [id]/
│               ├── error.tsx     # 個別TODOのエラー
│               ├── not-found.tsx # 404エラー
│               └── forbidden.tsx # 403エラー
```

### error.tsx実装パターン
```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログをサーバーに送信（Sentry統合）
    console.error('Error caught by error boundary:', error);
    
    // 本番環境ではSentryに送信
    if (process.env.NODE_ENV === 'production') {
      // Sentryは自動的にエラーをキャプチャ
    }
  }, [error]);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">エラーが発生しました</h2>
          <p className="mb-6 text-muted-foreground">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          {/* 開発環境では詳細情報を表示 */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                エラーの詳細（開発環境のみ）
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                {error.stack || error.message}
              </pre>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Digest: {error.digest}
                </p>
              )}
            </details>
          )}
          <Button onClick={reset}>もう一度試す</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### エラートラッキングの実装
```tsx
// グローバルエラーバウンダリー (global-error.tsx)
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ルートレベルのエラーをログ
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">
              システムエラーが発生しました
            </h1>
            <p className="mb-6 text-muted-foreground">
              申し訳ございません。システムに問題が発生しました。
            </p>
            <Button onClick={reset}>再読み込み</Button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### なぜ重要か
- **ユーザー体験**: 日本語の分かりやすいエラーメッセージ
- **エラー回復**: resetボタンで再試行可能
- **細分化**: 適切な粒度でエラーをキャッチ
- **モニタリング**: Sentryと統合してエラーを追跡
- **デバッグ**: 開発環境では詳細なエラー情報を表示

## Mobile-Responsive Patterns

### Server-Side Device Detection
headers()を使用してサーバーサイドでデバイスを判定し、最適化されたレイアウトを提供。

```tsx
export async function MobileOptimizedLayout({ children }: Props) {
  const deviceInfo = await getDeviceInfo();
  
  return (
    <div className={cn(
      'container mx-auto',
      deviceInfo.isMobile ? 'px-4' : 'px-8',
    )}>
      {deviceInfo.isMobile && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm">
            モバイルデバイスでアクセスしています。
            左右にスワイプして操作できます。
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
```

### Responsive Grid Patterns
```tsx
// Tailwind CSS v4のレスポンシブグリッド
<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
  {/* モバイルでは1列、デスクトップでは3列 */}
</div>

// タッチフレンドリーなボタンサイズ
<Button size={isMobile ? "lg" : "default"}>
  操作
</Button>
```

### なぜ重要か
- **レイアウトシフトの防止**: クライアントサイドでの判定によるちらつきを回避
- **パフォーマンス**: 必要なコンテンツのみを配信
- **UX**: デバイスに最適化された操作性

## Performance Monitoring

### Web Vitals計測コンポーネント
開発環境でリアルタイムにパフォーマンスメトリクスを表示。

```tsx
'use client';

export function PerformanceIndicator() {
  const [metrics, setMetrics] = useState<{
    ttfb?: number;
    fcp?: number;
    lcp?: number;
    cls?: number;
    inp?: number;
    fid?: number;
  }>({});

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const observer = new PerformanceObserver((list) => {
      // 各種メトリクスの計測
    });

    observer.observe({
      entryTypes: [
        'navigation',
        'paint',
        'largest-contentful-paint',
        'layout-shift',
        'first-input',
      ],
    });
  }, []);

  // メトリクスの可視化UI
}
```

### メトリクスの閾値
- **TTFB**: 良好 < 200ms, 要改善 > 600ms
- **FCP**: 良好 < 1.8s, 要改善 > 3s
- **LCP**: 良好 < 2.5s, 要改善 > 4s
- **CLS**: 良好 < 0.1, 要改善 > 0.25
- **FID**: 良好 < 100ms, 要改善 > 300ms
- **INP**: 良好 < 200ms, 要改善 > 500ms

## Form Patterns

### 楽観的更新パターン
useHookFormOptimisticActionを使用した即座のUI更新。

```tsx
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

// 楽観的状態の取得
const optimisticTodo = action.optimisticState?.todos.find(
  (t) => t.id === todo.id,
) || todo;
```

### Client ComponentsからServer Actionsをimportするパターン
通常、Server ActionsはServer Componentsから呼び出されるが、楽観的更新などの特定のケースではClient Componentsから直接importして使用可能。

```tsx
'use client';

// Client ComponentからServer Actionを直接import（例外的なケース）
import { toggleTodoCompleteAction } from '@/lib/actions/todos';
import { useHookFormOptimisticAction } from 'next-safe-action/hooks';

export function TodoItemWithOptimistic({ todo }: Props) {
  const { action } = useHookFormOptimisticAction(
    toggleTodoCompleteAction, // Server Action
    zodResolver(toggleSchema),
    {
      actionProps: { /* 楽観的更新の設定 */ },
    },
  );
  
  // フォーム送信時にServer Actionが実行される
  return (
    <form action={action}>
      {/* フォームの実装 */}
    </form>
  );
}
```

### なぜこのパターンが有効か
- **型安全性**: Server ActionsはTypeScriptで完全に型付けされる
- **シームレスな統合**: クライアント/サーバー境界を意識せずに実装
- **楽観的更新**: サーバー応答を待たずに即座にUIを更新
- **エラー処理**: Server Actionのエラーは自動的にクライアントで処理可能

### フォームの状態表示パターン
一貫したローディング状態とエラー表示の実装。

```tsx
// ローディング状態の表示
<Button 
  type="submit" 
  disabled={form.isPending}
  className={cn(
    "relative",
    form.isPending && "cursor-not-allowed opacity-70"
  )}
>
  {form.isPending ? (
    <>
      <span className="opacity-0">保存</span>
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    </>
  ) : (
    '保存'
  )}
</Button>

// エラー表示
{form.error && (
  <FormError error={form.error} />
)}

// 成功時の処理（Server Actionの戻り値で判定）
useEffect(() => {
  if (form.result?.data?.success) {
    toast.success('保存しました');
  }
}, [form.result]);
```

### フォーム送信の統一パターン
```tsx
// 1. フォームの初期化
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { /* 初期値 */ },
});

// 2. Server Actionとの統合
const { execute, isPending } = useAction(serverAction, {
  onSuccess: ({ data }) => {
    if (data?.success) {
      toast.success('成功しました');
    }
  },
  onError: ({ error }) => {
    toast.error(error.serverError || 'エラーが発生しました');
  },
});

// 3. 送信ハンドラー
const onSubmit = form.handleSubmit((data) => {
  execute(data);
});
```

## URL State Management

### nuqsを使用した型安全なURL状態管理
```tsx
const [status, setStatus] = useQueryState('status', {
  defaultValue: 'all' as FilterStatus,
  parse: (value): FilterStatus => {
    if (value === 'completed' || value === 'incomplete') {
      return value;
    }
    return 'all';
  },
});
```

### なぜURL状態管理が重要か
- **ブラウザナビゲーション**: 戻る/進むボタンの正常動作
- **共有可能**: URLでアプリケーション状態を共有
- **永続性**: リロード時も状態を維持

## Theme & Dark Mode

### Cookie-basedテーマ管理
Server Actionを使用してCookieにテーマを保存。

```tsx
// Client Component
const handleThemeChange = (theme: Theme) => {
  startTransition(async () => {
    await setTheme(theme); // Server Action
    toast.success('テーマ設定を保存しました');
  });
};

// Server Action
export async function setTheme(theme: Theme) {
  (await cookies()).set('theme-preference', theme, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1年
  });
}
```

## shadcn/ui コンポーネントパターン

### CVA (class-variance-authority)を使用したバリアント管理
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground...',
        destructive: 'bg-destructive text-white...',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
```

### Polymorphic Components (asChild)
Radix UIのSlotを使用した柔軟なコンポーネント実装。

```tsx
function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
}

// 使用例
<Button asChild>
  <Link href="/dashboard">ダッシュボード</Link>
</Button>
```

## Compositionパターン

### 基本的なComposition
variantに応じて適切なコンポーネントを選択し、共通のPropsを渡すパターン。

```tsx
// container.tsx
export async function TodoItemContainer({ id }: TodoItemContainerProps) {
  const todo = await getTodoByIdWithAuth(id);
  
  // variantに応じてコンポーネントを選択
  switch (variant) {
    case 'with-optimistic':
      return <TodoItemWithOptimistic todo={todo} />;
    case 'default':
    default:
      return <TodoItemPresentation todo={todo} />;
  }
}
```

### 高度なComposition: Server ComponentsをClient Componentsに渡す
Client ComponentでラップしながらServer Componentの利点を維持するパターン。

```tsx
// filter-wrapper.tsx (Client Component)
'use client';

export function TodoFilterWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-4">
      <TodoSearch />
      <TodoFilters />
      {children} {/* Server Componentが渡される */}
    </div>
  );
}

// 使用例 (Server Component)
export default async function TodosPage() {
  return (
    <TodoFilterWrapper>
      <Suspense fallback={<TodoListSkeleton />}>
        <TodoListContainer /> {/* Server Component */}
      </Suspense>
    </TodoFilterWrapper>
  );
}
```

### なぜ重要か
- **柔軟性**: 条件に応じて異なるコンポーネントを組み合わせ可能
- **RSC最適化**: Server ComponentsとClient Componentsの適切な境界設定
- **再利用性**: 共通のロジックを維持しながら異なるUIバリエーションを提供

## データフェッチパターン

### Request Memoizationの活用
Next.jsは同一リクエスト内での重複したデータフェッチを自動的にキャッシュ。

```tsx
// データフェッチのコロケーション
// 各コンポーネントで必要なデータを直接取得

// TodoListContainer
export async function TodoListContainer() {
  const todos = await getTodos(); // 1回目の呼び出し
  return <TodoListPresentation todos={todos} />;
}

// TodoSummaryContainer（同じページ内）
export async function TodoSummaryContainer() {
  const todos = await getTodos(); // 自動的にキャッシュされる
  const summary = calculateSummary(todos);
  return <TodoSummaryPresentation summary={summary} />;
}
```

### preloadパターン
コンポーネントのレンダリング前にデータフェッチを開始し、パフォーマンスを向上。

```tsx
// layout.tsx または page.tsx
import { preloadCurrentUser } from '@/lib/queries/users';

export default async function Layout({ children }) {
  // レンダリング前にデータフェッチを開始
  preloadCurrentUser();
  
  return (
    <div>
      <Header /> {/* HeaderコンポーネントでgetCurrentUser()を呼んでもキャッシュされる */}
      {children}
    </div>
  );
}

// queries/users.ts
export const preloadCurrentUser = () => {
  void getCurrentUser(); // Promiseを待たずに開始
};

export const getCurrentUser = cache(async () => {
  // データフェッチの実装
});
```

### なぜ重要か
- **パフォーマンス**: ウォーターフォールを回避し、並列データフェッチを実現
- **DX向上**: Props drillingを回避し、データが必要な場所で直接取得
- **自動最適化**: Request Memoizationにより重複呼び出しを防止

## 実装チェックリスト

### Container/Presentationalパターン
- [ ] `_containers/`ディレクトリに配置
- [ ] Container: データフェッチのみ
- [ ] Presentational: UIの表示のみ
- [ ] index.tsxからContainerのみexport

### Loading/Error UI
- [ ] 各ページに最適化されたloading.tsx
- [ ] error.tsx, not-found.tsx, forbidden.tsxの適切な配置
- [ ] 日本語のユーザーフレンドリーなメッセージ

### Performance
- [ ] 独立したSuspense境界の設定
- [ ] CLSを防ぐスケルトンUI
- [ ] Web Vitals計測（開発環境）

### Forms
- [ ] 楽観的更新の実装（該当する場合）
- [ ] 送信中の適切な状態表示
- [ ] エラーメッセージの表示

### Mobile対応
- [ ] Server-sideデバイス判定
- [ ] レスポンシブグリッド
- [ ] タッチフレンドリーなUI

### URL状態管理
- [ ] nuqsを使用した型安全な実装
- [ ] 適切なデフォルト値とパーサー