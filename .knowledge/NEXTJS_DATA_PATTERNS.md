# Next.js データパターンリファレンス

Remixユーザー向けのNext.js App Routerでのデータ取得パターンガイド。

## Server Component (RSC) でのデータ取得

### RemixのloaderとNext.jsのServer Componentの違い

Remixでは`loader`関数でデータ取得を行いますが、Next.jsではコンポーネント自体を非同期関数にして、直接データを取得します。

```typescript
// Remixの場合
export const loader = async () => {
  const todos = await db.todos.findMany();
  return json({ todos });
};

export default function Page() {
  const { todos } = useLoaderData();
  return <TodoList todos={todos} />;
}

// Next.jsの場合 - コンポーネント自体が非同期関数
export default async function Page() {
  const todos = await db.todos.findMany();
  return <TodoList todos={todos} />;
}
```

### 基本的なデータ取得パターン

Next.jsでは、ページコンポーネントを非同期関数として定義し、その中でデータ取得を行うコンポーネントを配置します。

```typescript
// src/app/(protected)/dashboard/mypage/page.tsx
export default async function MyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-bold text-3xl">マイページ</h1>
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListContainer />  {/* このコンポーネント内でデータ取得 */}
      </Suspense>
    </div>
  );
}
```

### server-only インポートの役割

データ取得を行うファイルでは、`server-only`をインポートすることで、そのコードがクライアント側で実行されないことを保証します。

```typescript
// src/lib/queries/todos.ts
import 'server-only';  // クライアントで実行されるとビルドエラーになる

export function getTodosByUserId(userId: string) {
  // DBアクセスなど、サーバー側でのみ実行すべきコード
}
```

これにより、DBの接続情報やAPIキーなどの機密情報が誤ってクライアントに露出することを防げます。

### Container/Presentationalパターン

このプロジェクトでは、データ取得とUI表示を明確に分離するパターンを採用しています。

```
app/(protected)/dashboard/mypage/
├── _containers/              # Server Components（データ取得）
│   └── task-list/
│       ├── index.tsx        # re-export用
│       ├── container.tsx    # データ取得ロジック
│       └── presentational.tsx # レイアウト定義
└── _components/             # Client Components（インタラクション）
    └── task-list.tsx       # UI実装
```

#### Container（データ取得層）

ContainerはServer Componentとして、データ取得を担当します。

```typescript
// src/app/(protected)/dashboard/mypage/_containers/task-list/container.tsx
import { getTodosByUserId } from '@/lib/queries/todos';
import { getSession } from '@/lib/services/auth';
import { TaskListPresentational } from './presentational';

export async function TaskListContainer() {
  const session = await getSession();
  const todos = await getTodosByUserId(session.user.id);

  return <TaskListPresentational todos={todos} />;
}
```

#### Presentational（レイアウト層）

Presentationalは、取得したデータをどのように配置するかを定義します。

```typescript
// src/app/(protected)/dashboard/mypage/_containers/task-list/presentational.tsx
import { TaskList } from '@/app/(protected)/dashboard/mypage/_components/task-list';
import type { Todo } from '@/db/schema';

interface Props {
  todos: Todo[];
}

export function TaskListPresentational({ todos }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">タスク一覧</h3>
      <TaskList todos={todos} />
    </div>
  );
}
```

### データキャッシュ戦略

Next.jsでは`unstable_cache`を使用してデータをキャッシュします。Remixの`Cache-Control`ヘッダーとは異なり、Next.jsではタグベースのキャッシュ無効化が可能です。

#### unstable_cache の使用

```typescript
// src/lib/queries/todos.ts
import 'server-only';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';

export function getTodosByUserId(userId: string) {
  return unstable_cache(
    async (): Promise<Todo[]> => {
      // 実際のデータ取得ロジック
      const userTodos = await db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId))
        .orderBy(desc(todos.createdAt));

      return userTodos;
    },
    [`getTodosByUserId-${userId}`],  // キャッシュキー
    {
      tags: [CACHE_TAGS.TODOS.USER(userId)],  // キャッシュタグ
      revalidate: 3600, // 1時間後に自動で再検証
    },
  )();
}
```

#### キャッシュタグの構造化

キャッシュタグを構造化することで、関連するデータを一括で無効化できます。

```typescript
// src/lib/utils/cache-tags.ts
export const CACHE_TAGS = {
  TODOS: {
    ALL: 'todos:all',
    ID: (id: string) => `todos:id:${id}`,
    USER: (userId: string) => `todos:user:${userId}`,
  },
} as const;
```

データ更新時は、Server Actionで`revalidateTag`を呼び出してキャッシュを無効化します。

### Suspense とストリーミング

Next.jsのSuspenseは、Remixの`defer`に相当する機能です。コンポーネント単位でローディング状態を管理し、データが準備でき次第、段階的にUIを表示します。

```typescript
// src/app/(protected)/dashboard/mypage/page.tsx
import { Suspense } from 'react';

export default async function MyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-semibold text-2xl">タスク</h2>
          {/* TaskListContainerのデータ取得中はSkeletonを表示 */}
          <Suspense fallback={<TaskListSkeleton />}>
            <TaskListContainer />
          </Suspense>
        </section>
        
        <section>
          <h2 className="mb-4 font-semibold text-2xl">日記</h2>
          {/* 各セクションが独立してデータ取得・表示される */}
          <Suspense fallback={<DiaryListSkeleton />}>
            <DiaryListContainer />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
```

#### スケルトンUIの実装

```typescript
function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-6 flex-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 並列データ取得

Remixではloaderで`Promise.all`を使いますが、Next.jsではSuspenseを使って各コンポーネントが独立してデータを取得できます。

#### Promise.allによる並列取得

```typescript
// 複数のデータを同時に取得する場合
export async function DashboardContainer() {
  const session = await getSession();
  
  // 並列でデータ取得
  const [todos, stats] = await Promise.all([
    getTodosByUserId(session.user.id),
    getTodoStats(session.user.id),
  ]);
  
  return <DashboardPresentational todos={todos} stats={stats} />;
}
```

#### Suspenseによる独立した並列取得

```typescript
// 各コンポーネントが独立してデータを取得
export default function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* それぞれが独立してデータ取得・表示 */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsContainer />
      </Suspense>
      
      <Suspense fallback={<TodoListSkeleton />}>
        <TodoListContainer />
      </Suspense>
    </div>
  );
}
```

## 動的ルーティング

### searchParamsの扱い

Remixでは`useSearchParams`フックを使いますが、Next.jsのServer Componentではpropsとして受け取ります。Next.js 15からはPromiseとして渡されます。

```typescript
// src/app/(protected)/dashboard/mypage/page.tsx
export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{  // Next.js 15からPromise
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  return (
    <div>
      <Suspense fallback={<DiaryListSkeleton />}>
        {/* searchParamsをそのまま渡す */}
        <DiaryListContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
```

#### Containerでの使用

```typescript
// _containers/diary-list/container.tsx
export async function DiaryListContainer({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string; }>;
}) {
  const params = await searchParams;
  
  // パラメータに基づいてデータをフィルタリング
  const diaries = await getDiaries({
    search: params.search,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
  
  return <DiaryListPresentational diaries={diaries} />;
}
```

## エラーハンドリング

Next.jsでは、Remixの`ErrorBoundary`と`CatchBoundary`に相当する機能を、それぞれ`error.tsx`と`not-found.tsx`で実装します。

### loading.tsx（ローディング状態）

ルートセグメント配下のコンポーネントがローディング中に自動的に表示されます。

```typescript
// app/(protected)/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

### error.tsx（エラーバウンダリ）

エラーが発生した場合に表示されます。必ずClient Componentである必要があります。

```typescript
// app/(protected)/dashboard/error.tsx
'use client';  // 必須

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### not-found.tsx（404エラー）

`notFound()`関数が呼ばれた時、または存在しないルートにアクセスした時に表示されます。

```typescript
// app/(protected)/dashboard/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
    </div>
  );
}
```

## データ取得の分離

このプロジェクトでは、データ取得ロジックを`lib/queries`に集約しています。

```
src/lib/
└── queries/        # データ取得（READ専用）
    └── todos.ts
```

### Query層の実装

```typescript
// src/lib/queries/todos.ts
import 'server-only';  // サーバー側でのみ実行

export function getTodoById(id: string, userId: string) {
  return unstable_cache(
    async (): Promise<Todo | null> => {
      const [todo] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .limit(1);

      return todo || null;
    },
    [`getTodoById-${id}`],
    {
      tags: [CACHE_TAGS.TODOS.USER(userId)],
      revalidate: 3600,
    },
  )();
}
```

### アクセス制御の実装

Remixではloaderで認証チェックを行いますが、Next.jsではquery関数内で実装します。

```typescript
export async function getTodoByIdWithAuth(
  id: string,
  userId: string,
): Promise<Todo | null> {
  const todo = await getTodoById(id, userId);

  if (!todo) {
    return null;
  }

  // 権限チェック
  if (todo.userId !== userId) {
    throw new Error('このTODOにアクセスする権限がありません');
  }

  return todo;
}
```