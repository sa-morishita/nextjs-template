import * as Sentry from '@sentry/nextjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteOldProfileImages,
  uploadProfileImageFromUrl,
} from '@/lib/services/profile-image.service';
import { storage } from '@/lib/storage/client';
import '@/test/storage-setup'; // パッチを適用

/**
 * Profile Image Service Storage結合テスト
 *
 * ローカルの MinIO インスタンスを使用した実際のStorage操作テスト
 * 実行前に `.document/scripts/setup-development-environment.sh` などで MinIO を起動してください
 */

// Sentryをモック
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// テスト用の定数
const TEST_USER_PREFIX = 'test-storage-';
const TEST_IMAGE_URL = 'https://avatars.githubusercontent.com/u/9919?s=150';

describe('Profile Image Service Storage結合テスト', () => {
  let testUserId: string;
  let uploadedFiles: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    // ユニークなテストユーザーIDを生成
    testUserId = `${TEST_USER_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    uploadedFiles = [];
  });

  afterEach(async () => {
    // テストでアップロードしたファイルをクリーンアップ
    if (uploadedFiles.length > 0) {
      try {
        const { error } = await storage.avatars.remove(uploadedFiles);

        if (error) {
          console.warn('Cleanup error:', error);
        }
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }
  });

  describe('uploadProfileImageFromUrl() - プロフィール画像アップロード', () => {
    describe('正常系', () => {
      it('LINEプロフィール画像URLからStorageにアップロードできること', async () => {
        // When: 画像URLからアップロード
        const result = await uploadProfileImageFromUrl(
          TEST_IMAGE_URL,
          testUserId,
        );

        // Then: アップロードが成功する
        expect(result.error).toBeNull();
        expect(result.url).toBeTruthy();
        expect(result.url).toContain('avatars');
        expect(result.url).toContain(testUserId);

        // クリーンアップ用にファイルパスを記録
        if (result.url) {
          const urlParts = new URL(result.url);
          const minioMatch = urlParts.pathname.match(/\/avatars\/(.*)/);

          if (minioMatch?.[1]) {
            uploadedFiles.push(minioMatch[1]);
          }
        }
      });
    });

    describe('異常系', () => {
      it('存在しないURLの場合エラーを返すこと', async () => {
        // Given: 存在しないドメインのURL
        const invalidUrl =
          'https://invalid-domain-that-does-not-exist-12345.com/image.jpg';

        // When: アップロードを試みる
        const result = await uploadProfileImageFromUrl(invalidUrl, testUserId);

        // Then: エラーが返され、Sentryに通知される
        expect(result.url).toBeNull();
        expect(result.error).toBeTruthy();
        expect(Sentry.captureException).toHaveBeenCalled();
      });
    });
  });

  describe('deleteOldProfileImages() - 古い画像削除', () => {
    describe('正常系', () => {
      it('複数の画像がある場合、最新の1つだけを残して削除すること', async () => {
        // Given: 3つの画像をアップロード
        for (let i = 0; i < 3; i++) {
          const response = await fetch(TEST_IMAGE_URL);
          const blob = await response.blob();
          const timestamp = Date.now() + i;
          const fileName = `${testUserId}/profile-${timestamp}.jpg`;

          const { data, error } = await storage.avatars.upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

          expect(error).toBeNull();
          if (data) {
            uploadedFiles.push(data.path);
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // When: 古い画像を削除
        await deleteOldProfileImages(testUserId);

        // Then: 最新の1つだけが残る
        const { data: filesAfter } = await storage.avatars.list(testUserId);

        expect(filesAfter?.length).toBe(1);
      });
    });
  });
});
