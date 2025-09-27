import { vi } from 'vitest';
import { storage, type UnifiedStorage } from '@/lib/storage/client';

/**
 * Storage結合テスト用のセットアップ
 * MinIO / Cloudflare R2 Storage との接続を設定
 */

// グローバルfetchのタイムアウト設定
if (!global.fetch) {
  // Node.js 18以降ではfetchがビルトインなので、この処理は不要かもしれません
  console.info('Native fetch is available');
}

// Node.js環境でのBlob処理をパッチ
// AWS SDK v3はNode.js環境でBlobをサポートしていないため、Bufferに変換する
const patchStorageForNodeJs = (storageInstance: UnifiedStorage) => {
  const originalUpload = storageInstance.upload.bind(storageInstance);
  storageInstance.upload = async (path, file, options) => {
    if (
      typeof window === 'undefined' &&
      file instanceof Blob &&
      !(file instanceof Buffer)
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return originalUpload(path, buffer, options);
    }
    return originalUpload(path, file, options);
  };
};

// すべてのStorageインスタンスにパッチを適用
Object.values(storage).forEach(patchStorageForNodeJs);

// コンソール出力のモック（必要に応じて）
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
