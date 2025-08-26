import 'server-only';
import { and, count, desc, eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { type Todo, todos } from '@/db/schema';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';

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

export function getTodoById(id: string) {
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
      tags: [CACHE_TAGS.TODOS.ALL],
      revalidate: 3600, // 1時間キャッシュ
    },
  )();
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
