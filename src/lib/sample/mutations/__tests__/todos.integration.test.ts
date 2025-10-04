import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { TodoInsert, TodoUpdate } from '@/lib/sample/mutations/todos';
import { createTodo, updateTodo } from '@/lib/sample/mutations/todos';
import {
  createTestTodo,
  createTestUser,
  todoFactory,
  userFactory,
} from '@/test/factories';
import { createTestDatabase } from '@/test/helpers/database-setup';
import { setTestDbInstance } from '@/test/integration-setup';

describe('TODO Mutations 結合テスト', () => {
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

  describe('createTodo() - TODO作成', () => {
    describe('正常系', () => {
      it('ユーザーが新しいTODOを作成できること', async () => {
        // Given: 認証済みユーザーが存在する
        const user = await createTestUser();

        // When: 新しいTODOを作成
        const todoData: TodoInsert = {
          userId: user.id,
          title: 'テスト用TODO',
          completed: false,
        };
        const todo = await createTodo(todoData);

        // Then: TODOが正しく作成される
        expect(todo).toBeDefined();
        expect(todo.id).toBeDefined();
        expect(todo.userId).toBe(user.id);
        expect(todo.title).toBe('テスト用TODO');
        expect(todo.completed).toBe(false);
        expect(todo.createdAt).toBeDefined();
        expect(todo.updatedAt).toBeDefined();
      });
    });
  });

  describe('updateTodo() - TODO更新', () => {
    describe('正常系', () => {
      it('ユーザーが自分のTODOを更新できること', async () => {
        // Given: ユーザーが作成したTODOが存在する
        const todo = await createTestTodo({
          title: '元のタイトル',
          completed: false,
        });

        // 少し待つことでupdatedAtの差を確保
        await new Promise((resolve) => setTimeout(resolve, 1));

        // When: タイトルと完了状態を更新
        const updateData: TodoUpdate = {
          title: '新しいタイトル',
          completed: true,
        };
        const updatedTodo = await updateTodo(todo.id, updateData, todo.userId);

        // Then: 更新内容が反映される
        expect(updatedTodo.id).toBe(todo.id);
        expect(updatedTodo.title).toBe('新しいタイトル');
        expect(updatedTodo.completed).toBe(true);
        expect(updatedTodo.userId).toBe(todo.userId);
        expect(updatedTodo.updatedAt?.getTime()).toBeGreaterThanOrEqual(
          todo.updatedAt?.getTime() || 0,
        );
      });
    });

    describe('異常系', () => {
      it('他のユーザーのTODOを更新しようとした場合エラーになること', async () => {
        // Given: 2人の異なるユーザーが存在し、user1がTODOを所有している
        const user1 = await createTestUser();
        const user2 = await createTestUser();
        const todo1 = await createTestTodo({
          title: 'ユーザー1のTODO',
          userId: user1.id,
        });

        // When: user2がuser1のTODOを更新しようとする
        const updateData: TodoUpdate = { title: '不正な更新' };

        // Then: 認可エラーが発生する
        await expect(
          updateTodo(todo1.id, updateData, user2.id),
        ).rejects.toThrow('TODO not found or access denied');
      });
    });
  });
});
