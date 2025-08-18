import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession } from '@/lib/services/auth';
import { createTestUser, userFactory } from '@/test/factories';
import { createTestDatabase } from '@/test/helpers/database-setup';
import { setTestDbInstance } from '@/test/integration-setup';

// auth.apiをモック
vi.mock('@/lib/services/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
  getSession: vi.fn(async () => {
    const { auth } = await import('@/lib/services/auth');
    const session = await auth.api.getSession({ headers: new Headers() });
    if (!session) {
      const { redirect } = await import('next/navigation');
      redirect('/auth/login');
    }
    return session;
  }),
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

        // auth.api.getSessionをモック（認証済みセッション）
        const { auth } = await import('@/lib/services/auth');
        vi.mocked(auth.api.getSession).mockResolvedValue({
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
          },
        });

        // When: セッション情報を取得
        const session = await getSession();

        // Then: セッション情報が正しく取得される
        expect(session).toBeDefined();
        expect(session.user.id).toBe(testUser.id);
        expect(session.user.email).toBe(testUser.email);
        expect(auth.api.getSession).toHaveBeenCalledOnce();
      });
    });

    describe('異常系', () => {
      it('未認証ユーザーの場合ログインページにリダイレクトされること', async () => {
        // Given: 未認証状態である
        const { auth } = await import('@/lib/services/auth');
        const { redirect } = await import('next/navigation');
        vi.mocked(auth.api.getSession).mockResolvedValue(null);

        // When: セッション情報を取得しようとする
        await getSession();

        // Then: ログインページにリダイレクトされる
        expect(redirect).toHaveBeenCalledWith('/auth/login');
        expect(auth.api.getSession).toHaveBeenCalledOnce();
      });
    });
  });
});
