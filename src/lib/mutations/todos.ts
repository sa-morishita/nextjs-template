import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { type NewTodo, type Todo, todos } from '@/db/schema';
export type TodoInsert = Omit<NewTodo, 'id' | 'createdAt' | 'updatedAt'>;
export type TodoUpdate = Partial<
  Omit<NewTodo, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export async function createTodo(data: TodoInsert): Promise<Todo> {
  const [newTodo] = await db.insert(todos).values(data).returning();

  if (!newTodo) {
    throw new Error('Failed to create todo');
  }

  return newTodo;
}

export async function updateTodo(
  id: string,
  data: TodoUpdate,
  userId: string,
): Promise<Todo> {
  const [updatedTodo] = await db
    .update(todos)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();

  if (!updatedTodo) {
    throw new Error('TODO not found or access denied');
  }

  return updatedTodo;
}
