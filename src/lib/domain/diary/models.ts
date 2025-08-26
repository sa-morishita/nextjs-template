import type { Diary } from '@/db/schema';

/**
 * 日記フィルターのドメインモデル
 */
export interface DiaryFilters {
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * 日付範囲を1日の終わりまで含むように調整する
 */
export function adjustDateToEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * フィルターがキャッシュ可能かどうかを判定する
 */
export function isDiaryFilterCacheable(filters?: DiaryFilters): boolean {
  return !(filters?.searchQuery || filters?.dateFrom || filters?.dateTo);
}

/**
 * 日記へのアクセス権限を検証する
 */
export function canAccessDiary(diary: Diary, userId: string): boolean {
  return diary.userId === userId;
}

/**
 * 日記アクセス権限エラー
 */
export class DiaryAccessDeniedError extends Error {
  constructor(diaryId: string, userId: string, ownerId: string) {
    super('この日記にアクセスする権限がありません');
    this.name = 'DiaryAccessDeniedError';
    console.log(
      `Forbidden access: User ${userId} tried to access diary ${diaryId} owned by ${ownerId}`,
    );
  }
}
