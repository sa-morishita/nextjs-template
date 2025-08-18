# Next.js App Router データ一覧表示ガイド

## Container/Presentational パターンによるリスト実装

Next.js App Router でのデータリストは Container/Presentational パターンが基本。Server Component でデータ取得、Shared/Client Component で表示を担当し、React Server Components の恩恵を最大化する。

### ディレクトリ構造の設計

Next.js App Router における Container/Presentational パターンのディレクトリ構造は、Server Components の制約と利点を最大化するために重要。従来の React アプリケーションとは異なり、Server Component と Client Component の明確な分離が必要であり、この構造がその分離を物理的に表現する。

```
app/
└── (protected)/
    └── dashboard/
        ├── _containers/          # Container/Presentationalパターン専用
        │   ├── todo-list/
        │   │   ├── index.tsx     # export { TodoListContainer } from './container'
        │   │   ├── container.tsx # Server Component - データフェッチ
        │   │   ├── presentational.tsx # Shared Component - UI表示
        │   │   └── __tests__/
        │   │       ├── container.test.ts      # Container専用テスト
        │   │       └── presentational.test.tsx # Presentational専用テスト
        │   ├── todo-item/
        │   │   ├── index.tsx
        │   │   ├── container.tsx
        │   │   ├── presentational.tsx
        │   │   └── _components/  # このContainer専用のClient Components
        │   │       └── client-wrapper.tsx
        │   └── todo-list-with-filter/
        │       ├── index.tsx
        │       ├── container.tsx
        │       ├── filter-wrapper.tsx # Client Component Wrapper
        │       └── presentational.tsx
        └── _components/          # 共通コンポーネント（従来型）
            └── todo-filters.tsx
```

**なぜこの構造が重要なのか：**

1. **Server/Client 境界の明確化**: container.tsx は必ず Server Component、presentational.tsx は Shared/Client Component という規約により、誤って`'use client'`を container に追加したり、async/await を presentational で使用するミスを防ぐ。

2. **インポートパスの制御**: index.tsx が Container のみをエクスポートすることで、使用側が誤って Presentational Component を直接インポートすることを防ぐ。これによりデータフェッチが確実に Container 経由で行われる。

3. **テストの分離戦略**: Container Components は Server Components として非同期関数のテスト、Presentational Components は React Testing Library でのユーザーインタラクションテストと、テスト手法が根本的に異なるため、物理的な分離が必要。

4. **バンドルサイズの最適化**: \_containers ディレクトリ内の container.tsx はサーバーサイドのみで実行されるため、クライアントバンドルに含まれない。この物理的な分離により、誤ってサーバー専用コードをクライアントに含めるリスクを排除。

### ファイル構成の原則

**1. index.tsx - エクスポートの一元化**

```tsx
// _containers/todo-list/index.tsx
export { TodoListContainer } from "./container";
// Presentationalは実装詳細として隠蔽（直接importさせない）
```

**2. container.tsx - Server Component**

```tsx
// _containers/todo-list/container.tsx
import { getTodosByUserId } from "@/lib/queries/todos";
import { getCurrentUser } from "@/lib/queries/users";
import { TodoListPresentation } from "./presentational";

export async function TodoListContainer({ searchParams }: Props) {
  // データフェッチのコロケーション - Props drillingを回避
  const currentUser = await getCurrentUser();
  const todos = await getTodosByUserId(currentUser.id);

  // サーバーサイドでデータ変換・フィルタリング
  const filteredTodos = filterTodosOnServer(todos, searchParams);

  return <TodoListPresentation todos={filteredTodos} />;
}
```

**3. presentational.tsx - Shared/Client Component**

```tsx
// _containers/todo-list/presentational.tsx
// 'use client'は必要な場合のみ（イベントハンドラがある場合）

export function TodoListPresentation({ todos }: Props) {
  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
```

### ネストしたコンポーネントの管理

Container 専用のコンポーネントは`_components`サブディレクトリに配置：

```
todo-item/
├── _components/
│   ├── client-wrapper.tsx      # 楽観的更新のためのClient Component
│   └── edit-button.tsx         # 編集ボタン（Client Component）
├── container.tsx
└── presentational.tsx
```

### 命名規則

- **Container**: `[Feature]Container` (例: TodoListContainer)
- **Presentational**: `[Feature]Presentation` (例: TodoListPresentation)
- **Wrapper**: `[Feature]Wrapper` (例: TodoFilterWrapper)
- **ディレクトリ**: kebab-case (例: todo-list)
- **テストファイル**: `container.test.ts`, `presentational.test.tsx`

### \_containers ディレクトリを使う理由

1. **明確な境界**: Container/Presentational パターンを使用している箇所が一目瞭然
2. **移行の容易さ**: 既存の`_components`と共存可能
3. **責務の分離**: データフェッチと UI の関心事を物理的にも分離
4. **テストの整理**: Container 用と Presentational 用のテストを明確に分離

## URL 状態管理によるフィルタリング

Next.js App Router では URL が Single Source of Truth。nuqs ライブラリで型安全な URL 状態管理を実現し、ブラウザバック/フォワード、リロード、共有可能な URL を提供。

### サーバーサイドフィルタリング（推奨）

```tsx
// Container ComponentでsearchParams propsを受け取る
export async function TodoListContainer({
  searchParams,
}: {
  searchParams?: { status?: string; search?: string };
}) {
  let todos = await getTodosByUserId(userId);

  // サーバー側でフィルタリング実行
  if (searchParams?.status === "completed") {
    todos = todos.filter((todo) => todo.completed);
  }

  if (searchParams?.search) {
    const searchLower = searchParams.search.toLowerCase();
    todos = todos.filter((todo) =>
      todo.title.toLowerCase().includes(searchLower)
    );
  }

  return <TodoListPresentation todos={todos} />;
}
```

サーバーサイドフィルタリングの利点：

- クライアントへの転送データ量削減
- JavaScript 無効環境でも動作
- SEO 対応（フィルタ結果もクロール可能）

### クライアントサイドフィルタリング（リアルタイム性重視時）

```tsx
// Client Component Wrapper - Compositionパターン
"use client";

import { TodoListPresentation } from '../todo-list/presentational';

export function TodoFilterWrapper({ todos }: { todos: Todo[] }) {
  const [filter, setFilter] = useState<FilterType>("all");

  // クライアントサイドでのフィルタリング
  const filteredTodos = todos.filter((todo) => {
    switch (filter) {
      case "completed":
        return todo.completed;
      case "incomplete":
        return !todo.completed;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4">
      {/* フィルターUI（Client Component） */}
      <FilterControls value={filter} onChange={setFilter} />
      
      {/* フィルタリングされたTODOリストを表示 */}
      <TodoListPresentation todos={filteredTodos} variant="optimistic" />
    </div>
  );
}
```

## nuqs による URL 状態管理

```tsx
"use client";

import { useQueryState } from "nuqs";

export function TodoSearch() {
  const [search, setSearch] = useQueryState("search", {
    defaultValue: "",
    shallow: false, // Server Componentの再実行をトリガー
  });

  return (
    <Input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="タスクを検索..."
    />
  );
}
```

nuqs の重要な設定：

- `shallow: false` - Server Component の再レンダリングをトリガー
- `defaultValue` - URL パラメータが無い場合のデフォルト値
- 自動的なデバウンス処理でパフォーマンス最適化

## Streaming SSR と Suspense 境界

Next.js App Router の最大の利点の一つが Streaming SSR。複数の Suspense 境界で独立したローディング状態を実現。

```tsx
// page.tsx - 独立したSuspense境界
export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<TodoSummarySkeleton />}>
        <TodoSummary />
      </Suspense>

      <Suspense fallback={<TodoListSkeleton />}>
        <TodoListContainer searchParams={searchParams} />
      </Suspense>
    </>
  );
}
```

Suspense 境界の設計原則：

- 独立して読み込まれるデータごとに境界を設定
- スケルトンは実際のコンテンツと同じレイアウト（CLS 防止）
- ネストした Suspense で段階的な表示も可能

## スケルトンコンポーネントの実装

```tsx
export function TodoListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
      ))}
    </div>
  );
}
```

スケルトン設計の重要点：

- 実際のコンテンツと同じ高さ・幅を維持
- animate-pulse クラスで読み込み中を表現
- 表示個数は実際のデータ量を想定

## 楽観的更新によるリスト操作

```tsx
const { action } = useHookFormOptimisticAction(
  toggleTodoCompleteAction,
  zodResolver(toggleSchema),
  {
    actionProps: {
      currentState: { todos },
      updateFn: (state, input) => ({
        todos: state.todos.map((todo) =>
          todo.id === input.id ? { ...todo, completed: input.completed } : todo
        ),
      }),
    },
  }
);

// 楽観的状態を優先表示
const displayTodos = action.optimisticState?.todos || todos;
```

楽観的更新が適切な操作：

- チェックボックスのトグル
- アイテムの並び替え
- 簡単なプロパティ更新

## キャッシュ戦略とタグ設計

```tsx
// queries/todos.ts
export async function getTodosByUserId(userId: string) {
  const supabase = await createClient({
    tags: [`todos-user-${userId}`, "todos-all"],
    next: { revalidate: 3600 }, // 1時間キャッシュ
  });

  const { data } = await supabase
    .from("sample_todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}
```

キャッシュタグの設計：

- `todos-user-${userId}` - ユーザー固有のリスト
- `todo-${id}` - 個別アイテム
- `todos-all` - 全体統計等で使用

## パフォーマンス最適化戦略

### Request Memoization

同一リクエスト内での重複データフェッチを自動的に排除。getCurrentUser()を複数箇所で呼んでも実際の DB アクセスは 1 回のみ。

### 並行データフェッチパターン

Next.js App Router では、独立したデータフェッチを並行で実行することでパフォーマンスを大幅に向上できる。

#### Promise.all による並行実行

```tsx
// ❌ 逐次実行（遅い）
const user = await getCurrentUser();
const summary = await getTodosSummary();

// ✅ 並行実行（速い）
const [user, summary] = await Promise.all([
  getCurrentUser(),
  getTodosSummary(),
]);
```

generateMetadata での活用例：

```tsx
export async function generateMetadata(): Promise<Metadata> {
  // 複数のデータを並行で取得
  const [user, summary] = await Promise.all([
    getCurrentUser(),
    getTodosSummary(),
  ]);

  return {
    title: `${user?.email}のダッシュボード`,
    description: `完了: ${summary.completed}件, 未完了: ${summary.pending}件`,
  };
}
```

#### Preload パターン

コンポーネントがレンダリングされる前にデータフェッチを開始：

```tsx
// queries/users.ts
export function preloadCurrentUser() {
  // awaitせずにPromiseを開始（並行処理）
  void getCurrentUser();
}

// page.tsx
export default async function Page() {
  // ページレベルで事前にデータフェッチを開始
  preloadCurrentUser();
  
  return (
    <div>
      {/* 子コンポーネントで実際に使用 */}
      <Suspense fallback={<Loading />}>
        <UserProfile />
      </Suspense>
    </div>
  );
}
```

preload パターンの利点：

- 子コンポーネントのレンダリングと並行してデータフェッチ
- Request Memoization により重複リクエストは発生しない
- ウォーターフォール問題の解消

### デバイス最適化

```tsx
// Server Componentでデバイス判定
export async function MobileOptimizedLayout({ children }: Props) {
  const isMobile = await getIsMobile();

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
```


## 空状態の実装

```tsx
export function EmptyState() {
  return (
    <Card className="p-8 text-center">
      <p className="text-muted-foreground">まだタスクがありません</p>
      <Button className="mt-4">最初のタスクを作成</Button>
    </Card>
  );
}
```

## 実装チェックリスト

- [ ] Container/Presentational パターンでリストを実装
- [ ] URL 状態管理（nuqs）でフィルタ・検索を実装
- [ ] サーバーサイドフィルタリングを優先的に検討
- [ ] 適切な Suspense 境界とスケルトンを設置
- [ ] キャッシュタグを適切に設計・実装
- [ ] 楽観的更新が必要な操作を識別・実装
- [ ] Request Memoization を活用したデータフェッチ
- [ ] Promise.all で並行データフェッチを実装
- [ ] Preload パターンでウォーターフォール問題を解消
- [ ] 空状態の UI を用意
- [ ] CLS 防止のためスケルトンサイズを調整
