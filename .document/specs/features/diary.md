# 日記機能仕様書

## 概要

画像アップロード対応の日記機能。プリサインドURL生成による安全なファイルアップロードシステム。

## 実装概要

### Server Actions

**ファイル**: `src/lib/actions/diary.ts`

#### 主要アクション

1. **createDiaryAction**
   - 日記エントリ新規作成
   - バリデーション: `createDiaryFormSchema`
   - キャッシュ無効化: `CACHE_TAGS.DIARIES.USER(userId)`

2. **getSignedUploadUrlAction**
   - 画像アップロード用プリサインドURL生成
   - バリデーション: `getSignedUploadUrlSchema`
   - フラットバリデーションエラー処理対応

### データフロー

```
UI Component → Server Action → Usecase → Service
```

- **Usecase**: 
  - `createDiaryUsecase()`: 日記作成
  - `generateDiaryImageUploadUrl()`: アップロードURL生成

## 画面構成

### 1. 日記作成画面 (`/dashboard/diary`)

**メインページ**: `src/app/(protected)/dashboard/diary/page.tsx`

**コンポーネント構成**:
- **フォーム**: `src/app/(protected)/dashboard/diary/_components/diary-form.tsx`
- **コンテナ**: `src/app/(protected)/dashboard/diary/_containers/diary-form/`
  - `index.tsx`: エントリーポイント
  - `container.tsx`: Server Component (データ取得・アクション)
  - `presentational.tsx`: UI Component (フォーム表示)

### 2. ダッシュボード内日記表示

**場所**: `/dashboard` (ホーム画面)

**コンポーネント**:
- **日記一覧**: `src/app/(protected)/dashboard/(home)/_containers/diary-list/`
- **日記アイテム**: `src/app/(protected)/dashboard/(home)/_components/diary-item.tsx`
- **詳細ダイアログ**: `src/app/(protected)/dashboard/(home)/_components/diary-detail-dialog.tsx`
- **フィルター**: `src/app/(protected)/dashboard/(home)/_components/diary-filters.tsx`

## ファイルアップロード機能

### プリサインドURL方式

**メリット**:
- サーバーを経由しない直接アップロード
- セキュリティと性能の両立
- トークンベースのアクセス制御

**処理フロー**:
1. クライアント: アップロードURL要求
2. サーバー: プリサインドURL生成
3. クライアント: Supabase Storageへ直接アップロード

### バリデーション

**ファイル**: `src/lib/schemas/upload.ts`

- `getSignedUploadUrlSchema`: アップロード要求検証
  - ファイル名
  - ファイルサイズ
  - MIME型
  - 拡張子制限

## アーキテクチャパターン

### Container/Presentational パターン

```
_containers/diary-form/
├── index.tsx          # エントリーポイント  
├── container.tsx      # Server Component
└── presentational.tsx # Client Component (フォーム)
```

**責任分離**:
- **Container**: データ取得、アクション実行
- **Presentational**: フォーム操作、ファイルアップロード

## データモデル

### DiarySchema (推定)

```typescript
{
  id: string
  title: string
  content: string
  imageUrl?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}
```

## バリデーション

**ファイル**: `src/lib/schemas/`

- `createDiaryFormSchema`: 日記作成フォーム検証
- `getSignedUploadUrlSchema`: アップロード要求検証

## キャッシュ戦略

**タグ構造**:
- `CACHE_TAGS.DIARIES.USER(userId)`: ユーザー別日記一覧

**無効化タイミング**:
- 日記作成後に自動無効化
- 部分更新による効率的なキャッシュ管理

## セキュリティ

1. **認証必須**: `privateActionClient`使用
2. **ユーザー分離**: `userId`による権限制御
3. **ファイル制限**: 
   - 許可されたMIME型のみ
   - ファイルサイズ制限
   - 安全なファイル名生成

## テスト

**ファイル**: `src/app/(protected)/dashboard/diary/_components/__tests__/diary-form.test.tsx`

- フォーム入力検証
- ファイルアップロード処理
- エラーハンドリング

## Storage構成

**場所**: Supabase Storage
- **バケット**: `diary-images` (推定)
- **パス構造**: `{userId}/{diaryId}/{filename}`
- **アクセス制御**: RLS (Row Level Security)

## Loading状態

**ファイル**: `src/app/(protected)/dashboard/diary/loading.tsx`

Suspense対応のローディング表示

## UI/UX特徴

1. **フィルター機能**: 日記の検索・絞り込み
2. **詳細ダイアログ**: モーダル表示での詳細閲覧
3. **画像プレビュー**: アップロード前の確認機能
4. **レスポンシブ対応**: モバイル・デスクトップ最適化