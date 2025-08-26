/**
 * TODO関連のUsecases
 */
import 'server-only';
import { returnValidationErrors } from 'next-safe-action';
import type { z } from 'zod';
import {
  calculateTodoStats,
  canAccessTodo,
  isValidTodoTitle,
  statsToSummary,
  TODO_MESSAGES,
  TodoAccessDeniedError,
  type TodoStats,
  type TodosSummary,
} from '@/lib/domain/todos';
import { createTodo, updateTodo } from '@/lib/mutations/todos';
import {
  getPendingTodoCount,
  getTodoById,
  getTodoByUserIdAndTitle,
  getTodosByUserId,
} from '@/lib/queries/todos';
import { createTodoFormSchema, updateTodoFormSchema } from '@/lib/schemas';
import { getSession } from '@/lib/services/auth';

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

  // 対象のTODOを取得
  const todo = await getTodoById(id);
  if (!todo) {
    returnValidationErrors(updateTodoFormSchema, {
      _errors: ['タスクが見つかりません'],
    });
  }

  // 権限チェック
  if (!canAccessTodo(todo, userId)) {
    throw new TodoAccessDeniedError(id, userId, todo.userId);
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

/**
 * Query用Usecases
 */

/**
 * ユーザーのTODOリストを取得する
 */
export async function getTodoListUsecase(context: UsecaseContext) {
  const { userId } = context;
  return getTodosByUserId(userId);
}

/**
 * ユーザーのTODO統計情報を取得する
 */
export async function getTodoStatsUsecase(
  context: UsecaseContext,
): Promise<TodoStats> {
  const { userId } = context;
  const todos = await getTodosByUserId(userId);
  return calculateTodoStats(todos);
}

/**
 * 現在ログイン中のユーザーのTODOサマリーを取得する
 */
export async function getTodosSummaryUsecase(): Promise<TodosSummary> {
  const session = await getSession();

  if (!session.user) {
    return { total: 0, completed: 0, pending: 0 };
  }

  const stats = await getTodoStatsUsecase({ userId: session.user.id });
  return statsToSummary(stats);
}

/**
 * ユーザーの未完了TODOの数を取得する
 */
export async function getPendingTodoCountUsecase(
  context: UsecaseContext,
): Promise<number> {
  const { userId } = context;
  return getPendingTodoCount(userId);
}

/**
 * IDでTODOを取得する（権限チェック付き）
 */
export async function getTodoByIdUsecase(
  todoId: string,
  context: UsecaseContext,
) {
  const { userId } = context;
  const todo = await getTodoById(todoId);

  if (!todo) {
    return null;
  }

  if (!canAccessTodo(todo, userId)) {
    throw new TodoAccessDeniedError(todoId, userId, todo.userId);
  }

  return todo;
}
