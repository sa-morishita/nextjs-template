import 'server-only';
import { and, count, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { type Todo, todos } from '@/db/schema';
import { getSession } from '@/lib/services/auth';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';

// 統計情報型定義
export interface TodoStats {
  total: number;
  completed: number;
  incomplete: number;
}

export interface TodosSummary {
  total: number;
  completed: number;
  pending: number;
}

export function getTodosByUserId(userId: string) {
  return unstable_cache(
    async (): Promise<Todo[]> => {
      const userTodos = await db
        .select()
        .from(todos)
        .where(eq(todos.userId, userId))
        .orderBy(desc(todos.createdAt));

      return userTodos;
    },
    [`getTodosByUserId-${userId}`],
    {
      tags: [CACHE_TAGS.TODOS.USER(userId)],
      revalidate: 3600, // 1時間キャッシュ
    },
  )();
}

export function getTodoById(id: string, userId: string) {
  return unstable_cache(
    async (): Promise<Todo | null> => {
      const [todo] = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .limit(1);

      return todo || null;
    },
    [`getTodoById-${id}`],
    {
      tags: [CACHE_TAGS.TODOS.USER(userId)],
      revalidate: 3600, // 1時間キャッシュ
    },
  )();
}

export async function getTodoByIdWithAuth(
  id: string,
  userId: string,
): Promise<Todo | null> {
  const todo = await getTodoById(id, userId);

  if (!todo) {
    return null;
  }

  // ベストプラクティス: アクセス制御
  // 他のユーザーのTODOにアクセスしようとした場合はエラーを発生
  if (todo.userId !== userId) {
    console.log(
      `Forbidden access: User ${userId} tried to access TODO ${id} owned by ${todo.userId}`,
    );
    throw new Error('このTODOにアクセスする権限がありません');
  }

  return todo;
}

export async function getTodoStats(userId: string): Promise<TodoStats> {
  const todos = await getTodosByUserId(userId);

  const stats: TodoStats = {
    total: todos.length,
    completed: todos.filter((todo) => todo.completed).length,
    incomplete: todos.filter((todo) => !todo.completed).length,
  };

  return stats;
}

export async function getTodosSummary(): Promise<TodosSummary> {
  const session = await getSession();

  if (!session.user) {
    return { total: 0, completed: 0, pending: 0 };
  }

  const stats = await getTodoStats(session.user.id);

  return {
    total: stats.total,
    completed: stats.completed,
    pending: stats.incomplete,
  };
}

export function getPendingTodoCount(userId: string) {
  return unstable_cache(
    async (): Promise<number> => {
      const result = await db
        .select({ count: count() })
        .from(todos)
        .where(and(eq(todos.userId, userId), eq(todos.completed, false)));

      return result[0]?.count ?? 0;
    },
    [`getPendingTodoCount-${userId}`],
    {
      tags: [CACHE_TAGS.TODOS.USER(userId)],
      revalidate: 60, // 1分間キャッシュ
    },
  )();
}

export async function getTodoByUserIdAndTitle(
  userId: string,
  title: string,
): Promise<Todo | null> {
  const [todo] = await db
    .select()
    .from(todos)
    .where(
      and(
        eq(todos.userId, userId),
        eq(todos.title, title),
        eq(todos.completed, false),
      ),
    )
    .limit(1);

  return todo || null;
}
