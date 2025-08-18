# 詳細ページ実装パターン

Next.js 15 App Routerでの詳細ページ実装に特化したパターンと制約事項。

## Dynamic Routes実装

### params propsの処理
```typescript
// Next.js 15ではparamsがPromiseとして提供される
export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // 必ずawaitで展開
}
```

理由：Streaming SSRの効率化のための設計変更。

### generateMetadataでの動的メタデータ
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getData(id);
  
  if (!data) {
    return { title: 'データが見つかりません' };
  }
  
  return {
    title: `${data.title} - 詳細`,
    description: data.description,
  };
}
```

## エラーハンドリング階層

### 1. not-found.tsx
- `notFound()`関数呼び出し時に表示
- HTTPステータス404を返す
- Route Segment単位で定義可能
- 親レイアウトは維持される

### 2. error.tsx
- Server Componentsのエラーをキャッチ
- 必ずClient Component（`'use client'`必須）
- `reset()`関数でエラー回復機能を提供

### 3. loading.tsx
- Streaming SSR中の表示
- Skeletonコンポーネントで実際のレイアウトを維持
- Layout Shiftの防止

## 認可パターン

### クエリ層での認可実装
```typescript
// lib/queries/todos.ts
export async function getTodoByIdWithAuth(
  id: string,
  userId: string
): Promise<Todo> {
  const todo = await getTodoById(id); // 既存関数を再利用
  
  if (!todo) {
    notFound();
  }
  
  // 所有者チェック
  if (todo.user_id !== userId) {
    console.log(
      `Unauthorized access: User ${userId} tried to access TODO ${id} owned by ${todo.user_id}`
    );
    // 認可エラーの場合は404として扱う（セキュリティのため）
    notFound();
  }
  
  return todo;
}
```

理由：データアクセス層での認可により、どこから呼ばれても安全性を保証。

### ページコンポーネントでの使用
```typescript
export default async function TodoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('認証が必要です');
  }
  
  // 認可チェック付きクエリを使用
  const todo = await getTodoByIdWithAuth(id, currentUser.id);
  // ここに到達した時点で認可済み（認可エラーの場合はnotFound()が呼ばれる）
}
```

## 関連データの並列取得

### Promise.allによる並列フェッチ
```typescript
export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error('認証が必要です');
  }
  
  // 関連データの並列取得
  const [todo, comments, attachments] = await Promise.all([
    getTodoByIdWithAuth(id, currentUser.id),
    getCommentsByTodoId(id),
    getAttachmentsByTodoId(id),
  ]);
  
  // すべてのデータが揃ってからレンダリング
}
```

理由：シーケンシャルな取得より高速。ただし、一つでも失敗すると全体が失敗する。

### Promise.allSettledによる部分的失敗の許容
```typescript
const results = await Promise.allSettled([
  getTodoByIdWithAuth(id, currentUser.id),
  getOptionalMetadata(id), // 失敗しても良いデータ
  getRelatedTodos(id),     // 失敗しても良いデータ
]);

const todo = results[0].status === 'fulfilled' ? results[0].value : null;
if (!todo) {
  notFound();
}

const metadata = results[1].status === 'fulfilled' ? results[1].value : null;
const relatedTodos = results[2].status === 'fulfilled' ? results[2].value : [];
```

理由：必須データと任意データを区別し、部分的な失敗を許容できる。

## キャッシング戦略

### タグベースの無効化
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, {
  cache: 'force-cache',
  next: { tags: [`todo-${id}`] }
});
```

### Request Memoization活用
同一レンダリング内での重複リクエストは自動的に最適化される。既存関数を再利用することで、この恩恵を受ける。

## 実装チェックリスト

- [ ] params propsをPromiseとして受け取り、awaitで展開しているか
- [ ] generateMetadataで動的メタデータを生成しているか
- [ ] notFound()で404エラーを適切に処理しているか
- [ ] 認可チェックはクエリ層で実装しているか
- [ ] 認証エラーを適切に処理しているか（認証なし）
- [ ] 認可エラーの場合は適切に処理しているか（notFound()等）
- [ ] error.tsxはClient Componentとして実装しているか
- [ ] loading.tsxでSkeletonを使用しているか
- [ ] 関連データの並列取得を適切に実装しているか
- [ ] Promise.allとPromise.allSettledを使い分けているか
- [ ] キャッシュタグを適切に設定しているか
- [ ] エラーログを適切に記録しているか