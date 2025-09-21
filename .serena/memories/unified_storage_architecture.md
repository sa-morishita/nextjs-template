# 統一Storageアーキテクチャ (2025-09-21)

## 概要
開発環境（MinIO）と本番環境（Supabase Storage）を統一的に扱えるStorageレイヤーの実装。

## 実装ファイル
- `src/lib/storage/client.ts`: 統一Storageクライアント
- `src/lib/domain/storage/bucket-config.ts`: バケット設定管理
- `src/lib/supabase/storage.ts`: Supabase Storage接続

## 主要クラス

### UnifiedStorage
環境に応じて MinIO と Supabase Storage を自動切り替えするクラス。

**主要メソッド**:
- `upload()`: ファイルアップロード
- `createSignedUploadUrl()`: プリサインドURL生成
- `getPublicUrl()`: 公開URL取得
- `list()`: ファイル一覧取得
- `remove()`: ファイル削除

**環境判定**:
- NODE_ENV が development/test かつ localhost URL → MinIO
- それ以外 → Supabase Storage

## バケット設定

### BUCKET_CONFIGS
```typescript
{
  avatars: {
    maxFileSize: 5MB,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    isPublic: true
  },
  diaries: {
    maxFileSize: 5MB,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    isPublic: true
  }
}
```

## 使用例

```typescript
import { storage } from '@/lib/storage/client';

// avatarsバケットにアップロード
const { data, error } = await storage.avatars.upload(
  'user123/profile.jpg',
  file,
  { contentType: 'image/jpeg' }
);

// 公開URLを取得
const { data: { publicUrl } } = await storage.avatars.getPublicUrl(path);
```

## 新しいバケットの追加手順

1. `bucket-config.ts` の BUCKET_CONFIGS に追加
2. `supabase/config.toml` に [storage.buckets.xxx] を追加（本番用）
3. 開発環境で `/dev:create-storage-bucket xxx` を実行（MinIO用）

## 利用サービス

- **プロフィール画像**: profile-image.service.ts
- **日記画像**: image-upload.service.ts

## セキュリティ

- **開発環境**: MinIOの基本認証
- **本番環境**: Supabase RLS + Service Role Key
- **ファイル検証**: validateFile() 関数による統一検証