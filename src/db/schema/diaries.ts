import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

// 日記テーブル
export const diaries = pgTable(
  'diaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title'),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    blurDataUrl: text('blur_data_url'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, published, archived
    type: varchar('type', { length: 20 }).notNull().default('diary'), // diary, note, memo
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // ユーザーIDとステータスの複合インデックス（マイページでの表示用）
    index('idx_diaries_user_id_status').on(table.userId, table.status),
    // ユーザーIDと作成日時の複合インデックス（日付順表示用）
    index('idx_diaries_user_id_created_at').on(table.userId, table.createdAt),
    // タイプによる検索用インデックス
    index('idx_diaries_type').on(table.type),
  ],
);

// 型定義
export type Diary = typeof diaries.$inferSelect;
export type NewDiary = typeof diaries.$inferInsert;
