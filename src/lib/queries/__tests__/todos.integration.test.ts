import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTodosByUserId } from '@/lib/queries/todos';
import { getSession } from '@/lib/services/auth';
import {
  getTodoByIdUsecase,
  getTodosSummaryUsecase,
} from '@/lib/usecases/todos';
import {
  createTestTodo,
  createTestUser,
  todoFactory,
  userFactory,
} from '@/test/factories';
import { createTestDatabase } from '@/test/helpers/database-setup';
import { setTestDbInstance } from '@/test/integration-setup';

// auth serviceをモック（getTodosSummary用）
vi.mock('@/lib/services/auth', () => ({
  getSession: vi.fn(),
}));

describe('TODO Queries 結合テスト', () => {
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    // 新しいテスト用DBインスタンスを作成
    const setup = await createTestDatabase();
    setTestDbInstance(setup.testDb);
    cleanup = setup.cleanup;

    // ファクトリーのシーケンスをリセット
    userFactory.rewindSequence();
    todoFactory.rewindSequence();
  });

  afterEach(async () => {
    await cleanup();
    setTestDbInstance(null);
  });

  describe('getTodosByUserId() - ユーザーTODO一覧取得', () => {
    describe('正常系', () => {
      it('ユーザーが自分のTODO一覧を閲覧できること', async () => {
        // Given: ユーザーが複数のTODOを持っている
        const user = await createTestUser();
        await createTestTodo({
          title: 'TODO 1',
          completed: false,
          userId: user.id,
        });
        await createTestTodo({
          title: 'TODO 2',
          completed: true,
          userId: user.id,
        });

        // 他のユーザーのTODOも存在する
        const otherUser = await createTestUser();
        await createTestTodo({
          title: 'Other TODO',
          completed: false,
          userId: otherUser.id,
        });

        // When: ユーザーのTODO一覧を取得
        const todos = await getTodosByUserId(user.id);

        // Then: 自分のTODOのみが作成日時順（降順）で取得される
        expect(todos).toHaveLength(2);
        expect(todos.map((t) => t.title)).toContain('TODO 1');
        expect(todos.map((t) => t.title)).toContain('TODO 2');
        expect(todos.map((t) => t.title)).not.toContain('Other TODO');
        expect(todos.every((t) => t.userId === user.id)).toBe(true);

        // 作成日時順（降順）でソートされていることを確認
        expect(todos[0].createdAt?.getTime()).toBeGreaterThanOrEqual(
          todos[1].createdAt?.getTime() || 0,
        );
      });
    });
  });

  describe('getTodoByIdWithAuth() - 認可チェック付きTODO取得', () => {
    describe('正常系', () => {
      it('ユーザーが自分のTODO詳細を閲覧できること', async () => {
        // Given: ユーザーが作成したTODOが存在する
        const user = await createTestUser();
        const todo = await createTestTodo({
          title: 'テスト TODO',
          userId: user.id,
        });

        // When: 自分のTODOの詳細を取得
        const result = await getTodoByIdUsecase(todo.id, { userId: user.id });

        // Then: TODO詳細が取得できる
        expect(result).toBeDefined();
        expect(result?.id).toBe(todo.id);
        expect(result?.title).toBe('テスト TODO');
        expect(result?.userId).toBe(user.id);
      });
    });

    describe('異常系', () => {
      it('他のユーザーのTODOにアクセスしようとした場合エラーになること', async () => {
        // Given: 2人の異なるユーザーが存在し、user1がTODOを所有している
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        const todo = await createTestTodo({
          title: 'ユーザー1のTODO',
          userId: user1.id,
        });

        // When: user2がuser1のTODOにアクセスしようとする
        // Then: 認可エラーが発生する
        await expect(
          getTodoByIdUsecase(todo.id, { userId: user2.id }),
        ).rejects.toThrow('このTODOにアクセスする権限がありません');
      });
    });
  });

  describe('getTodosSummary() - ダッシュボード統計取得', () => {
    describe('正常系', () => {
      it('ユーザーがTODO統計をダッシュボードで確認できること', async () => {
        // Given: 認証済みユーザーが完了・未完了のTODOを持っている
        const user = await createTestUser();

        // getSessionをモック
        vi.mocked(getSession).mockResolvedValue({
          user: {
            ...user,
            name: user.name || 'Test User', // nullの場合はデフォルト値を使用
          },
          session: {
            id: 'session-123',
            userId: user.id,
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date(),
            token: 'session-token-123',
          },
        });

        // 完了・未完了のTODOを作成
        await createTestTodo({
          title: 'TODO 1',
          completed: true,
          userId: user.id,
        });
        await createTestTodo({
          title: 'TODO 2',
          completed: false,
          userId: user.id,
        });
        await createTestTodo({
          title: 'TODO 3',
          completed: false,
          userId: user.id,
        });

        // When: ダッシュボード統計を取得
        const summary = await getTodosSummaryUsecase();

        // Then: 正しい統計情報が取得される
        expect(summary.total).toBe(3);
        expect(summary.completed).toBe(1);
        expect(summary.pending).toBe(2);
      });
    });
  });
});
