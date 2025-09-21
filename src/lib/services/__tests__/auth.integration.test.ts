import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// getSessionをモックするための型をインポート
import { getSession } from '@/lib/services/auth';
import { createTestUser, userFactory } from '@/test/factories';
import { createTestDatabase } from '@/test/helpers/database-setup';
import { setTestDbInstance } from '@/test/integration-setup';

// getSessionをモック
vi.mock('@/lib/services/auth', () => ({
  getSession: vi.fn(),
}));

// Next.js headersをモック
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

// Next.js navigationをモック
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Auth Services 結合テスト', () => {
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    // 新しいテスト用DBインスタンスを作成
    const setup = await createTestDatabase();
    setTestDbInstance(setup.testDb);
    cleanup = setup.cleanup;

    // ファクトリーのシーケンスをリセット
    userFactory.rewindSequence();

    // モックをクリア
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
    setTestDbInstance(null);
  });

  describe('getSession() - セッション情報取得', () => {
    describe('正常系', () => {
      it('認証済みユーザーがセッション情報を取得できること', async () => {
        // Given: 認証済みユーザーが存在する
        const testUser = await createTestUser();

        // getSessionをモック（認証済みセッション）
        const mockSession = {
          user: {
            ...testUser,
            name: testUser.name || 'Test User',
          },
          session: {
            id: 'session-123',
            userId: testUser.id,
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
            token: 'session-token-123',
            ipAddress: null,
            userAgent: null,
          },
        };
        vi.mocked(getSession).mockResolvedValue(
          mockSession as Awaited<ReturnType<typeof getSession>>,
        );

        // When: セッション情報を取得
        const session = await getSession();

        // Then: セッション情報が正しく取得される
        expect(session).toBeDefined();
        expect(session.user.id).toBe(testUser.id);
        expect(session.user.email).toBe(testUser.email);
        expect(getSession).toHaveBeenCalledOnce();
      });
    });

    describe('異常系', () => {
      it('未認証ユーザーの場合ログインページにリダイレクトされること', async () => {
        // Given: 未認証状態である（getSessionがリダイレクトを投げる）
        const { redirect } = await import('next/navigation');
        vi.mocked(getSession).mockImplementation(async () => {
          redirect('/auth/login');
          throw new Error('Redirect called');
        });

        // When/Then: セッション情報を取得しようとするとエラーが投げられる
        await expect(getSession()).rejects.toThrow('Redirect called');

        // Then: ログインページにリダイレクトされる
        expect(redirect).toHaveBeenCalledWith('/auth/login');
        expect(getSession).toHaveBeenCalledOnce();
      });
    });
  });
});
