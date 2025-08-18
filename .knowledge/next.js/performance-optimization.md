# パフォーマンス最適化

Next.js App Routerにおけるパフォーマンス最適化の実装パターンと具体的な手法。

## Streaming SSR

### Suspense境界の設計
```tsx
// 独立したデータフェッチを持つコンポーネントごとにSuspense境界を設定
<Suspense fallback={<TodoSummarySkeleton />}>
  <TodoSummary />
</Suspense>
<Suspense fallback={<TodoListSkeleton />}>
  <TodoListContainer />
</Suspense>
```

**重要**: 各Suspense境界は独立してストリーミングされるため、細かく分割することで初期表示を高速化できる。

### Streaming SSRの設定
Streaming SSRにより動的な部分が独立してロードされる。

### Loading UIの実装
```tsx
// loading.tsxでレイアウトレベルのローディング
export default function Loading() {
  return (
    <div className="grid gap-6">
      <TodoSummarySkeleton />
      <TodoListSkeleton />
    </div>
  )
}
```

**ポイント**: Skeletonコンポーネントは実際のコンテンツと同じレイアウトを維持し、CLSを防ぐ。

### useTransitionによるページ遷移UX改善

**問題**: RSCのfetchベース遷移ではブラウザのローディングインジケーターが表示されず、ユーザーが遷移状態を認識できない。

**解決**: `useTransition`でプログラム遷移時に明示的な状態管理を行う。

```tsx
'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function NavigateButton({ href, children }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? '読み込み中...' : children}
    </button>
  );
}
```

**重要**: RSC採用時は3段階のローディングUI設計が必須
- **loading.tsx**: ページ全体の遷移
- **useTransition**: ボタンクリック等の操作時
- **Suspense**: 部分的な非同期コンテンツ

## キャッシュ戦略

### タグベースのキャッシュ管理
```typescript
// src/lib/supabase/server.ts
const createFetch = (options: { next?: NextFetchRequestConfig }) => {
  return (url: RequestInfo, init?: RequestInit) => {
    return fetch(url, {
      ...init,
      next: { ...options.next, ...init?.next },
    })
  }
}
```

### キャッシュタグの設計
- `todos-user-${userId}`: ユーザー固有のTODOリスト
- `todo-${id}`: 個別のTODO
- `todos-all`: 全体リスト（管理画面用）
- `users-all`: ユーザー情報

### キャッシュ無効化戦略
```typescript
// Create時
revalidateTag(`todos-user-${userId}`)
revalidateTag("todos-all")

// Update時
revalidateTag(`todo-${id}`)
revalidateTag(`todos-user-${userId}`)

// Delete時
revalidateTag(`todo-${id}`)
revalidateTag(`todos-user-${userId}`)
revalidateTag("todos-all")
```

## Web Vitalsモニタリング

### 開発環境でのリアルタイムモニタリング
```tsx
// src/components/ui/performance-indicator.tsx
const metrics = ["TTFB", "FCP", "LCP", "CLS", "FID", "INP"]

// PerformanceObserver APIで各メトリクスを監視
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // メトリクスを収集・表示
  }
})
```

### パフォーマンス閾値
- **良好**: TTFB < 800ms, FCP < 1800ms, LCP < 2500ms, CLS < 0.1
- **要改善**: TTFB < 1800ms, FCP < 3000ms, LCP < 4000ms, CLS < 0.25
- **不良**: それ以上

## データフェッチの最適化

### Preloadパターン
```typescript
// src/lib/queries/users.ts
export const preloadCurrentUser = () => {
  void getCurrentUser() // Promiseを無視してデータフェッチを開始
}
```

ページコンポーネントの早い段階でpreloadを呼び出すことで、データフェッチを並列化。

### 並列データフェッチ
```typescript
// 複数のデータを並列で取得
const [todos, user] = await Promise.all([
  getTodosByUserId(userId),
  getCurrentUser()
])
```

### Request Memoization
Next.js App Routerは同一レンダリング内での重複したfetchを自動的にメモ化する。同じクエリを複数のコンポーネントから呼んでも、実際のリクエストは1回のみ。

## Container/Presentationalパターンによる最適化

### RSCペイロードの削減
```typescript
// container.tsx - サーバーコンポーネント
export async function TodoListContainer() {
  const todos = await getTodos() // データフェッチ
  return <TodoListPresentational todos={todos} />
}

// presentational.tsx - 最小限のクライアントコンポーネント
"use client"
export function TodoListPresentational({ todos }) {
  // UIロジックのみ
}
```

**効果**: 
- クライアントバンドルサイズの削減
- サーバーサイドでのデータ処理
- コンポーネントの責務分離

## 開発時のパフォーマンス可視化

### simulateDelayユーティリティ
```typescript
// src/lib/utils/delay.ts
export async function simulateDelay(ms: number = 1000) {
  if (process.env.NODE_ENV === "development") {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

開発環境でストリーミングSSRの動作を確認するための遅延シミュレーション。

## デバイス最適化

### サーバーサイドデバイス検出
```typescript
// src/lib/utils/device-detection.ts
export async function isMobileDevice() {
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""
  return /mobile|android|iphone|ipad/i.test(userAgent)
}
```

クライアントサイドのレイアウトシフトを防ぐため、サーバーサイドでデバイスを判定。

## ビルド最適化

### next.config.tsの設定
```javascript
{
  // 本番環境でconsole.*を削除（エラー以外）
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error"],
    } : false,
  },
  // Turbopackで高速な開発環境
  // pnpm devコマンドで自動的に有効
}
```

## エラーバウンダリーによるパフォーマンス保護

### グローバルエラーハンドリング
```tsx
// app/global-error.tsx
"use client"
export default function GlobalError({ error, reset }) {
  // ルートレベルのエラーをキャッチ
  // アプリケーション全体のクラッシュを防ぐ
}
```

### ページレベルのエラーハンドリング
```tsx
// app/(protected)/error.tsx
export default function Error({ error, reset }) {
  // 特定のページのエラーを分離
  // 他のページへの影響を防ぐ
}
```

## Optimistic Updatesによる体感速度向上

### 楽観的更新の実装
```tsx
const [optimisticTodos, setOptimisticTodos] = useOptimistic(todos)

// 即座にUIを更新
setOptimisticTodos(prev => [...prev, newTodo])
// バックグラウンドでサーバー更新
await createTodo(formData)
```

**効果**: ネットワーク遅延を感じさせない即座のフィードバック。

## フォント最適化

### Next.js Font Optimization
```typescript
// Variable fontとsubset指定
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
})
```

## Middlewareによる効率的なセッション管理

### 静的アセットの除外によるパフォーマンス向上
```typescript
// src/middleware.ts
export const config = {
  matcher: [
    // 静的アセットを除外してミドルウェアの実行を最小化
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

**効果**:
- 画像、フォント、静的ファイルへのリクエストでミドルウェアを実行しない
- セッション更新処理の無駄な実行を防ぐ
- 静的アセットの配信速度向上

### Supabaseセッション更新の最適化
```typescript
// すべてのルートでセッション更新を実行
const { response } = await updateSession(request)
return response
```

**ポイント**: 
- 認証が必要なルートと不要なルートを分けずに統一的に処理
- セッション有効期限の自動延長で再認証を最小化
- クッキーベースのセッション管理で高速なアクセス制御

## 実装チェックリスト

- [ ] 独立したデータフェッチを持つコンポーネントにSuspense境界を設定
- [ ] Streaming SSRの効果を確認
- [ ] Skeletonコンポーネントは実際のレイアウトと一致させCLSを防ぐ
- [ ] キャッシュタグは適切な粒度で設計（ユーザー固有/リソース固有/グローバル）
- [ ] データ更新時は影響範囲に応じてキャッシュを無効化
- [ ] 並列実行可能なデータフェッチは`Promise.all`で最適化
- [ ] Container/Presentationalパターンでクライアントバンドルを最小化
- [ ] 開発環境でPerformanceIndicatorを活用してメトリクスを監視
- [ ] エラーバウンダリーで部分的な失敗を分離
- [ ] Optimistic Updatesで体感速度を向上
- [ ] デバイス判定はサーバーサイドで実行しレイアウトシフトを防ぐ
- [ ] Middlewareで静的アセットを除外しパフォーマンスを最適化