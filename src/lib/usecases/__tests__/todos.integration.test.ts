import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getTodoById, getTodosByUserId } from '@/lib/queries/todos';
import { createTodoUsecase, updateTodoUsecase } from '@/lib/usecases/todos';
import {
  createTestTodo,
  createTestUser,
  todoFactory,
  userFactory,
} from '@/test/factories';
import { createTestDatabase } from '@/test/helpers/database-setup';
import {
  expectFieldValidationError,
  expectValidationError,
} from '@/test/helpers/validation-error-assertions';
import { setTestDbInstance } from '@/test/integration-setup';

interface UsecaseContext {
  userId: string;
}

describe('TODO Usecases 結合テスト', () => {
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const setup = await createTestDatabase();
    setTestDbInstance(setup.testDb);
    cleanup = setup.cleanup;

    userFactory.rewindSequence();
    todoFactory.rewindSequence();
  });

  afterEach(async () => {
    await cleanup();
    setTestDbInstance(null);
  });

  describe('createTodoUsecase - TODO作成ビジネスロジック', () => {
    describe('正常系', () => {
      it('有効なタイトルで新しいTODOを作成できること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When: 正常なタイトルでTODO作成
        await createTodoUsecase({ title: '買い物リスト' }, context);

        // Then: TODOが作成される
        const todos = await getTodosByUserId(user.id);
        expect(todos).toHaveLength(1);
        expect(todos[0].title).toBe('買い物リスト');
        expect(todos[0].userId).toBe(user.id);
        expect(todos[0].completed).toBe(false);
      });

      it('同じタイトルでも完了済みTODOが存在する場合は作成できること', async () => {
        // Given: 完了済みTODOが存在
        const user = await createTestUser();
        await createTestTodo({
          userId: user.id,
          title: '重複タイトル',
          completed: true,
        });
        const context: UsecaseContext = { userId: user.id };

        // When: 同じタイトルで新規TODO作成
        await createTodoUsecase({ title: '重複タイトル' }, context);

        // Then: 作成成功
        const todos = await getTodosByUserId(user.id);
        const newTodo = todos.find((t) => !t.completed);
        expect(newTodo).toBeDefined();
        expect(newTodo?.title).toBe('重複タイトル');
        expect(newTodo?.completed).toBe(false);
      });
    });

    describe('異常系', () => {
      it('無効な文字を含むタイトルは拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 制御文字を含むタイトルで作成
        const titleWithControlChar = 'TODO\x00テスト'; // NULL文字を含む
        await expect(
          createTodoUsecase({ title: titleWithControlChar }, context),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createTodoUsecase({ title: titleWithControlChar }, context);
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'title',
            'タイトルに使用できない文字が含まれています',
          );
        }
      });

      it('未完了の同じタイトルが存在する場合は作成できないこと', async () => {
        // Given: 未完了TODOが存在
        const user = await createTestUser();
        await createTestTodo({
          userId: user.id,
          title: '既存のTODO',
          completed: false,
        });
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 同じタイトルで作成試行
        await expect(
          createTodoUsecase({ title: '既存のTODO' }, context),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await createTodoUsecase({ title: '既存のTODO' }, context);
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'title',
            '同じタイトルの未完了タスクが既に存在します',
          );
        }
      });

      it('空のタイトルは拒否されること', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 空タイトルで作成
        await expect(createTodoUsecase({ title: '' }, context)).rejects.toThrow(
          'Server Action server validation error',
        );

        try {
          await createTodoUsecase({ title: '' }, context);
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'title',
            'タイトルに使用できない文字が含まれています',
          );
        }
      });
    });
  });

  describe('updateTodoUsecase - TODO更新ビジネスロジック', () => {
    describe('正常系', () => {
      it('自分のTODOのタイトルと完了状態を更新できること', async () => {
        // Given: ユーザーが所有するTODO
        const user = await createTestUser();
        const todo = await createTestTodo({
          userId: user.id,
          title: '元のタイトル',
          completed: false,
        });
        const context: UsecaseContext = { userId: user.id };

        // When: タイトルと完了状態を更新
        await updateTodoUsecase(
          {
            id: todo.id,
            title: '更新後のタイトル',
            completed: true,
          },
          context,
        );

        // Then: 更新成功
        const updatedTodo = await getTodoById(todo.id, user.id);
        expect(updatedTodo?.title).toBe('更新後のタイトル');
        expect(updatedTodo?.completed).toBe(true);
      });

      it('完了にする際は重複タイトルでも更新できること', async () => {
        // Given: 他の未完了TODOと自分のTODO
        const user = await createTestUser();
        await createTestTodo({
          userId: user.id,
          title: '重複タイトル',
          completed: false,
        });
        const myTodo = await createTestTodo({
          userId: user.id,
          title: '別のタイトル',
          completed: false,
        });
        const context: UsecaseContext = { userId: user.id };

        // When: 重複タイトルに変更しつつ完了
        await updateTodoUsecase(
          {
            id: myTodo.id,
            title: '重複タイトル',
            completed: true,
          },
          context,
        );

        // Then: 更新成功（完了時は重複チェックなし）
        const updatedTodo = await getTodoById(myTodo.id, user.id);
        expect(updatedTodo?.title).toBe('重複タイトル');
        expect(updatedTodo?.completed).toBe(true);
      });

      it('完了状態のみの更新も可能なこと', async () => {
        // Given: 未完了TODO
        const user = await createTestUser();
        const todo = await createTestTodo({
          userId: user.id,
          title: 'タスク',
          completed: false,
        });
        const context: UsecaseContext = { userId: user.id };

        // When: 完了状態のみ更新
        await updateTodoUsecase(
          {
            id: todo.id,
            completed: true,
          },
          context,
        );

        // Then: 更新成功
        const updatedTodo = await getTodoById(todo.id, user.id);
        expect(updatedTodo?.title).toBe('タスク');
        expect(updatedTodo?.completed).toBe(true);
      });
    });

    describe('異常系', () => {
      it('他のユーザーのTODOは更新できないこと', async () => {
        // Given: 他ユーザーのTODO
        const otherUser = await createTestUser();
        const otherTodo = await createTestTodo({
          userId: otherUser.id,
          title: '他人のTODO',
        });
        const currentUser = await createTestUser();
        const context: UsecaseContext = { userId: currentUser.id };

        // When & Then: 他人のTODOを更新試行
        await expect(
          updateTodoUsecase(
            {
              id: otherTodo.id,
              title: '不正な更新',
            },
            context,
          ),
        ).rejects.toThrow('このTODOにアクセスする権限がありません');
      });

      it('存在しないTODOは更新できないこと', async () => {
        // Given: 認証済みユーザー
        const user = await createTestUser();
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 存在しないIDで更新
        // UUIDフォーマットの存在しないIDを使用
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await expect(
          updateTodoUsecase(
            {
              id: nonExistentId,
              title: '更新',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await updateTodoUsecase(
            {
              id: nonExistentId,
              title: '更新',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectValidationError(error, 'タスクが見つかりません');
        }
      });

      it('未完了TODOのタイトル変更時、重複タイトルは拒否されること', async () => {
        // Given: 既存の未完了TODOと別の未完了TODO
        const user = await createTestUser();
        await createTestTodo({
          userId: user.id,
          title: '既存タイトル',
          completed: false,
        });
        const myTodo = await createTestTodo({
          userId: user.id,
          title: '別タイトル',
          completed: false, // 未完了
        });
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 重複タイトルに変更
        await expect(
          updateTodoUsecase(
            {
              id: myTodo.id,
              title: '既存タイトル',
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await updateTodoUsecase(
            {
              id: myTodo.id,
              title: '既存タイトル',
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'title',
            '同じタイトルの未完了タスクが既に存在します',
          );
        }
      });

      it('無効な文字を含むタイトルへの更新は拒否されること', async () => {
        // Given: 正常なTODO
        const user = await createTestUser();
        const todo = await createTestTodo({
          userId: user.id,
          title: '正常なタイトル',
        });
        const context: UsecaseContext = { userId: user.id };

        // When & Then: 制御文字を含むタイトルに更新
        const titleWithControlChar = 'TODO\x1fテスト'; // Unit Separator制御文字
        await expect(
          updateTodoUsecase(
            {
              id: todo.id,
              title: titleWithControlChar,
            },
            context,
          ),
        ).rejects.toThrow('Server Action server validation error');

        try {
          await updateTodoUsecase(
            {
              id: todo.id,
              title: titleWithControlChar,
            },
            context,
          );
          expect.fail('Expected error to be thrown');
        } catch (error) {
          expectFieldValidationError(
            error,
            'title',
            'タイトルに使用できない文字が含まれています',
          );
        }
      });
    });
  });
});
