# タスク管理機能仕様書

## 概要

ユーザー個別のタスク管理システム。作成、編集、削除、完了状態の切り替えが可能。

## 実装概要

### Server Actions

**ファイル**: `src/lib/actions/todos.ts`

#### 主要アクション

1. **createTodoAction**
   - タスク新規作成
   - バリデーション: `createTodoFormSchema`
   - キャッシュ無効化: `CACHE_TAGS.TODOS.USER(userId)`

2. **updateTodoAction**
   - タスク編集
   - バリデーション: `updateTodoFormSchema`
   - キャッシュ無効化: `CACHE_TAGS.TODOS.USER(userId)`

3. **toggleTodoAction**
   - 完了状態の切り替え専用アクション
   - パラメータバインド: `todoId`
   - 入力スキーマ: `{ completed: boolean }`

### データフロー

```
UI Component → Server Action → Usecase → Mutation/Query
```

- **Usecase**: `src/lib/usecases/todos.ts`
  - `createTodoUsecase()`
  - `updateTodoUsecase()`

## 画面構成

### 1. タスク一覧画面 (`/dashboard/tasks`)

**メインページ**: `src/app/(protected)/dashboard/tasks/page.tsx`

**コンポーネント構成**:
- **フォーム**: `src/app/(protected)/dashboard/tasks/_components/task-form.tsx`
- **コンテナ**: `src/app/(protected)/dashboard/tasks/_containers/task-form/`
  - `index.tsx`: エントリーポイント
  - `container.tsx`: データ取得・ビジネスロジック
  - `presentational.tsx`: UI表示のみ

### 2. ダッシュボード内タスク表示

**場所**: `/dashboard` (ホーム画面)

**コンポーネント**:
- **タスク一覧**: `src/app/(protected)/dashboard/(home)/_containers/task-list/`
- **タスクアイテム**: `src/app/(protected)/dashboard/(home)/_components/task-item.tsx`

## アーキテクチャパターン

### Container/Presentational パターン

```
_containers/task-form/
├── index.tsx          # エントリーポイント
├── container.tsx      # Server Component (データ取得)
└── presentational.tsx # UI Component (表示のみ)
```

**責任分離**:
- **Container**: データ取得、Server Actions実行
- **Presentational**: Props受け取り、UI描画のみ

## データモデル

### TodoSchema (推定)

```typescript
{
  id: string
  title: string
  description?: string
  completed: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}
```

## バリデーション

**ファイル**: `src/lib/schemas/`

- `createTodoFormSchema`: 新規作成フォーム検証
- `updateTodoFormSchema`: 編集フォーム検証

## キャッシュ戦略

**タグ構造**:
- `CACHE_TAGS.TODOS.USER(userId)`: ユーザー別タスク一覧

**無効化タイミング**:
- 作成/更新/削除後に自動無効化
- `revalidateTag()`による部分無効化

## テスト

**ファイル**: `src/app/(protected)/dashboard/tasks/_components/__tests__/task-form.test.tsx`

- フォーム入力検証
- Server Action実行テスト
- エラーハンドリングテスト

## セキュリティ

1. **認証必須**: `privateActionClient`使用
2. **ユーザー分離**: `ctx.userId`による権限制御
3. **入力検証**: Zodスキーマによる厳密な検証

## パフォーマンス最適化

1. **Server Components**: 初期表示の高速化
2. **部分キャッシュ無効化**: 必要な部分のみ更新
3. **楽観的更新**: toggleTodoActionで即座にUI更新

## Loading状態

**ファイル**: `src/app/(protected)/dashboard/tasks/loading.tsx`

Suspense境界でのローディング表示対応