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
UI Component → Server Action → Usecase → Service → Storage
```

### レイヤー別責務

- **Server Action** (`diary.ts`): 
  - バリデーション
  - エラーハンドリング
  - キャッシュ無効化
  
- **Usecase**: 
  - `createDiaryUsecase()`: 日記作成ビジネスロジック
  - `generateDiaryImageUploadUrl()`: URL生成ロジック
  
- **Service** (`image-upload.service.ts`):
  - 統一Storageクライアントの利用
  - ファイル名生成
  - URL生成処理
  
- **Storage** (`storage/client.ts`):
  - MinIO/Supabase自動切り替え
  - 統一API提供

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

**ファイル**:
- `src/lib/schemas/upload.ts`: 基本バリデーション
- `src/lib/domain/storage/prefix-config.ts`: プレフィックスごとの設定

**検証内容**:
- `validateFile()`: 統一ファイル検証関数
  - プレフィックス設定に基づくMIME型チェック
  - ファイルサイズ上限チェック
  - エラーメッセージの日本語対応

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
  - プレフィックス設定による統一制限
   - MIME型ホワイトリスト方式
   - ファイルサイズ上限（5MB）
   - UUID による安全なファイル名生成
4. **環境別セキュリティ**:
   - **開発**: MinIO の基本認証
   - **本番**: Supabase RLS + Service Role Key

## テスト

**ファイル**: `src/app/(protected)/dashboard/diary/_components/__tests__/diary-form.test.tsx`

- フォーム入力検証
- ファイルアップロード処理
- エラーハンドリング

## Storage構成

### 統一Storageアーキテクチャ（2025-09-21更新）

**実装ファイル**:
- `src/lib/storage/client.ts`: 統一Storageインターフェース
- `src/lib/domain/storage/prefix-config.ts`: プレフィックス設定管理

**環境別実装**:
- **開発/テスト環境**: MinIO (S3互換ストレージ)
  - 自動起動設定済み
  - ポート自動割り当て
- **本番環境**: Cloudflare R2
  - 共有バケット `app` の配下に `diaries/` などのプレフィックスで保存

### プレフィックス設定

**プレフィックス**: `diaries/`
- **パス構造**: `{userId}/{uniqueId}.{拡張子}`
- **最大ファイルサイズ**: 5MB
- **許可MIME型**: 
  - image/jpeg
  - image/jpg  
  - image/png
  - image/webp
- **アクセス**: パブリック（共有バケット `app` 内のプレフィックスとして公開）

### ファイルアップロードフロー

1. **プリサインドURL生成**: 
   - MinIO: S3 署名付きURL
   - Supabase: ネイティブ署名URL
2. **クライアント直接アップロード**
3. **メタデータ保存**: データベースに画像URLを記録

## Loading状態

**ファイル**: `src/app/(protected)/dashboard/diary/loading.tsx`

Suspense対応のローディング表示

## UI/UX特徴

1. **フィルター機能**: 日記の検索・絞り込み
2. **詳細ダイアログ**: モーダル表示での詳細閲覧
3. **画像プレビュー**: アップロード前の確認機能
4. **レスポンシブ対応**: モバイル・デスクトップ最適化
