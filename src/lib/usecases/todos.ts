/**
 * TODO関連のUsecases
 */
import 'server-only';
import { returnValidationErrors } from 'next-safe-action';
import type { z } from 'zod';
import { isValidTodoTitle, TODO_MESSAGES } from '@/lib/domain/todos';
import { createTodo, updateTodo } from '@/lib/mutations/todos';
import {
  getTodoByIdWithAuth,
  getTodoByUserIdAndTitle,
} from '@/lib/queries/todos';
import { createTodoFormSchema, updateTodoFormSchema } from '@/lib/schemas';

/**
 * Usecase Context
 */
interface UsecaseContext {
  userId: string;
}

/**
 * TODO作成の入力型
 */
export type CreateTodoInput = z.infer<typeof createTodoFormSchema>;

/**
 * TODO作成のビジネスロジック
 * - タイトルの妥当性チェック
 * - 重複チェック（同じユーザーの未完了タスクで同名のものが存在しないか）
 * - TODO作成
 */
export async function createTodoUsecase(
  input: CreateTodoInput,
  context: UsecaseContext,
): Promise<void> {
  const { title } = input;
  const { userId } = context;

  // タイトルの妥当性チェック
  if (!isValidTodoTitle(title)) {
    returnValidationErrors(createTodoFormSchema, {
      title: {
        _errors: [TODO_MESSAGES.TITLE_INVALID_CHARS],
      },
    });
  }

  // 重複チェック（同じユーザーの未完了タスクで同名のものが存在しないか）
  const existingTodo = await getTodoByUserIdAndTitle(userId, title);
  if (existingTodo) {
    returnValidationErrors(createTodoFormSchema, {
      title: {
        _errors: [TODO_MESSAGES.DUPLICATE_TITLE],
      },
    });
  }

  // TODOを作成
  await createTodo({
    userId,
    title,
    completed: false,
  });
}

/**
 * TODO更新の入力型
 */
export type UpdateTodoInput = z.infer<typeof updateTodoFormSchema>;

/**
 * TODO更新のビジネスロジック
 * - 存在確認と権限チェック（getTodoByIdWithAuthで実施）
 * - タイトル更新時の妥当性チェック
 * - タイトル更新時の重複チェック（自分以外）
 * - TODO更新
 */
export async function updateTodoUsecase(
  input: UpdateTodoInput,
  context: UsecaseContext,
): Promise<void> {
  const { id, title, completed } = input;
  const { userId } = context;

  // 対象のTODOを取得（権限チェック込み）
  const todo = await getTodoByIdWithAuth(id, userId);
  if (!todo) {
    returnValidationErrors(updateTodoFormSchema, {
      _errors: ['タスクが見つかりません'],
    });
  }

  // タイトル更新の場合
  if (title !== undefined && title !== todo.title) {
    // タイトルの妥当性チェック
    if (!isValidTodoTitle(title)) {
      returnValidationErrors(updateTodoFormSchema, {
        title: {
          _errors: [TODO_MESSAGES.TITLE_INVALID_CHARS],
        },
      });
    }

    // 重複チェック（同じユーザーの未完了タスクで同名のものが存在しないか）
    // ただし、完了済みにする場合は重複チェック不要
    if (completed !== true && !todo.completed) {
      const existingTodo = await getTodoByUserIdAndTitle(userId, title);
      if (existingTodo && existingTodo.id !== id) {
        returnValidationErrors(updateTodoFormSchema, {
          title: {
            _errors: [TODO_MESSAGES.DUPLICATE_TITLE],
          },
        });
      }
    }
  }

  // 更新データの準備
  const updateData: { title?: string; completed?: boolean } = {};
  if (title !== undefined) updateData.title = title;
  if (completed !== undefined) updateData.completed = completed;

  // TODOを更新
  await updateTodo(id, updateData, userId);
}
