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
} from '@/lib/sample/domain/todos';
import { createTodo, updateTodo } from '@/lib/sample/mutations/todos';
import {
  getPendingTodoCount,
  getTodoById,
  getTodoByUserIdAndTitle,
  getTodosByUserId,
} from '@/lib/sample/queries/todos';
import {
  createTodoFormSchema,
  updateTodoFormSchema,
} from '@/lib/sample/schemas/todos';
import { getSession } from '@/lib/services/auth';

interface UsecaseContext {
  userId: string;
}

export type CreateTodoInput = z.infer<typeof createTodoFormSchema>;

export async function createTodoUsecase(
  input: CreateTodoInput,
  context: UsecaseContext,
): Promise<void> {
  const { title } = input;
  const { userId } = context;

  if (!isValidTodoTitle(title)) {
    returnValidationErrors(createTodoFormSchema, {
      title: {
        _errors: [TODO_MESSAGES.TITLE_INVALID_CHARS],
      },
    });
  }

  const existingTodo = await getTodoByUserIdAndTitle(userId, title);
  if (existingTodo) {
    returnValidationErrors(createTodoFormSchema, {
      title: {
        _errors: [TODO_MESSAGES.DUPLICATE_TITLE],
      },
    });
  }

  await createTodo({
    userId,
    title,
    completed: false,
  });
}

export type UpdateTodoInput = z.infer<typeof updateTodoFormSchema>;

export async function updateTodoUsecase(
  input: UpdateTodoInput,
  context: UsecaseContext,
): Promise<void> {
  const { id, title, completed } = input;
  const { userId } = context;

  const todo = await getTodoById(id);
  if (!todo) {
    returnValidationErrors(updateTodoFormSchema, {
      _errors: ['タスクが見つかりません'],
    });
  }

  if (!canAccessTodo(todo, userId)) {
    throw new TodoAccessDeniedError(id, userId, todo.userId);
  }

  if (title !== undefined && title !== todo.title) {
    if (!isValidTodoTitle(title)) {
      returnValidationErrors(updateTodoFormSchema, {
        title: {
          _errors: [TODO_MESSAGES.TITLE_INVALID_CHARS],
        },
      });
    }

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

  const updateData: { title?: string; completed?: boolean } = {};
  if (title !== undefined) updateData.title = title;
  if (completed !== undefined) updateData.completed = completed;

  await updateTodo(id, updateData, userId);
}

export async function getTodoListUsecase(context: UsecaseContext) {
  const { userId } = context;
  return getTodosByUserId(userId);
}

export async function getTodoStatsUsecase(
  context: UsecaseContext,
): Promise<TodoStats> {
  const { userId } = context;
  const todos = await getTodosByUserId(userId);
  return calculateTodoStats(todos);
}

export async function getTodosSummaryUsecase(): Promise<TodosSummary> {
  const session = await getSession();

  if (!session.user) {
    return { total: 0, completed: 0, pending: 0 };
  }

  const stats = await getTodoStatsUsecase({ userId: session.user.id });
  return statsToSummary(stats);
}

export async function getPendingTodoCountUsecase(
  context: UsecaseContext,
): Promise<number> {
  const { userId } = context;
  return getPendingTodoCount(userId);
}

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
