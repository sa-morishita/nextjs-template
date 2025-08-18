import 'server-only';
import { db } from '@/db';
import { type Diary, diaries, type NewDiary } from '@/db/schema';

export type DiaryInsert = Omit<NewDiary, 'id' | 'createdAt' | 'updatedAt'>;
export type DiaryUpdate = Partial<
  Omit<NewDiary, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

export async function createDiary(data: DiaryInsert): Promise<Diary> {
  const [newDiary] = await db.insert(diaries).values(data).returning();

  if (!newDiary) {
    throw new Error('Failed to create diary');
  }

  return newDiary;
}
