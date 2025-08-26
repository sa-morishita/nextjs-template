/**
 * Fishery を使用した型安全なファクトリー実装
 * @praha/drizzle-factory の型問題を回避
 */

import { Factory } from 'fishery';
import { db } from '@/db';
import type { Diary, Todo, User } from '@/db/schema';
import {
  diaries as diariesTable,
  todos as todosTable,
  user as userTable,
} from '@/db/schema';

// Fishery の Factory は完全に型安全
export const userFactory = Factory.define<User>(({ sequence }) => ({
  id: `user-${sequence}`,
  email: `test-${sequence}@example.com`,
  name: `Test User ${sequence}`,
  emailVerified: false,
  image: null,
  lineUserId: null,
  lineUserName: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const todoFactory = Factory.define<Todo>(
  ({ sequence, associations }) => ({
    id: crypto.randomUUID(),
    title: `Test TODO ${sequence}`,
    completed: false,
    userId: associations.userId || `user-${sequence}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);

export const diaryFactory = Factory.define<Diary>(
  ({ sequence, associations }) => ({
    id: crypto.randomUUID(),
    title: `Test Diary ${sequence}`,
    content: `This is test diary content ${sequence}`,
    userId: associations.userId || `user-${sequence}`,
    imageUrl: null,
    blurDataUrl: null,
    status: 'published',
    type: 'diary',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
);

// DBに保存するヘルパー関数
export async function createTestUserInDB(
  overrides?: Partial<User>,
): Promise<User> {
  const userData = userFactory.build(overrides);
  const [created] = await db.insert(userTable).values(userData).returning();
  return created;
}

export async function createTestTodoInDB(
  overrides?: Partial<Todo>,
): Promise<Todo> {
  // ユーザーIDが指定されていない場合は新しいユーザーを作成
  let userId = overrides?.userId;
  if (!userId) {
    const testUser = await createTestUserInDB();
    userId = testUser.id;
  }

  const todoData = todoFactory.build({
    ...overrides,
    userId,
  });

  const [created] = await db.insert(todosTable).values(todoData).returning();
  return created;
}

export async function createTestDiaryInDB(
  overrides?: Partial<Diary>,
): Promise<Diary> {
  // ユーザーIDが指定されていない場合は新しいユーザーを作成
  let userId = overrides?.userId;
  if (!userId) {
    const testUser = await createTestUserInDB();
    userId = testUser.id;
  }

  const diaryData = diaryFactory.build({
    ...overrides,
    userId,
  });

  // 明示的に型キャストして、必要なプロパティを含む形式にする
  const insertData = {
    ...diaryData,
    blurDataUrl: diaryData.blurDataUrl ?? null,
  };

  const [created] = await db
    .insert(diariesTable)
    .values(insertData)
    .returning();
  return created;
}
