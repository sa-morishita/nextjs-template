import type { Todo } from '@/db/schema';

/**
 * TODO統計情報のドメインモデル
 */
export interface TodoStats {
  total: number;
  completed: number;
  incomplete: number;
}

/**
 * TODOサマリー情報のドメインモデル
 */
export interface TodosSummary {
  total: number;
  completed: number;
  pending: number;
}

/**
 * TODO配列から統計情報を計算する
 */
export function calculateTodoStats(todos: Todo[]): TodoStats {
  return {
    total: todos.length,
    completed: todos.filter((todo) => todo.completed).length,
    incomplete: todos.filter((todo) => !todo.completed).length,
  };
}

/**
 * 統計情報をサマリー形式に変換する
 */
export function statsToSummary(stats: TodoStats): TodosSummary {
  return {
    total: stats.total,
    completed: stats.completed,
    pending: stats.incomplete, // ビジネスルール: incomplete → pending
  };
}

/**
 * TODOへのアクセス権限を検証する
 */
export function canAccessTodo(todo: Todo, userId: string): boolean {
  return todo.userId === userId;
}

/**
 * TODOアクセス権限エラー
 */
export class TodoAccessDeniedError extends Error {
  constructor(todoId: string, userId: string, ownerId: string) {
    super('このTODOにアクセスする権限がありません');
    this.name = 'TodoAccessDeniedError';
    console.log(
      `Forbidden access: User ${userId} tried to access TODO ${todoId} owned by ${ownerId}`,
    );
  }
}
