import 'server-only';
import { and, between, desc, eq, gte, like, lte, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { type Diary, diaries } from '@/db/schema';
import type { DiaryFilters } from '@/lib/sample/domain/diary';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';
import { getJapanEndOfDay, getJapanStartOfDay } from '@/lib/utils/date';

export function getUserDiaries(userId: string, filters?: DiaryFilters) {
  return unstable_cache(
    async (): Promise<Diary[]> => {
      const conditions = [eq(diaries.userId, userId)];

      // 検索条件の適用
      if (filters?.searchQuery) {
        const searchCondition = or(
          like(diaries.title, `%${filters.searchQuery}%`),
          like(diaries.content, `%${filters.searchQuery}%`),
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // 日付範囲フィルター
      if (filters?.dateFrom) {
        conditions.push(gte(diaries.createdAt, filters.dateFrom));
      }
      if (filters?.dateTo) {
        conditions.push(lte(diaries.createdAt, filters.dateTo));
      }

      const result = await db
        .select()
        .from(diaries)
        .where(and(...conditions))
        .orderBy(desc(diaries.createdAt));

      return result;
    },
    [`getUserDiaries-${userId}-${JSON.stringify(filters || {})}`],
    {
      tags: [CACHE_TAGS.DIARIES.USER(userId)],
      revalidate:
        filters && (filters.searchQuery || filters.dateFrom || filters.dateTo)
          ? false
          : 3600,
    },
  )();
}

export function getTodaysDiaryByUserId(userId: string) {
  return unstable_cache(
    async (): Promise<Diary | null> => {
      const now = new Date();
      const startOfDay = getJapanStartOfDay(now);
      const endOfDay = getJapanEndOfDay(now);

      const [diary] = await db
        .select()
        .from(diaries)
        .where(
          and(
            eq(diaries.userId, userId),
            between(diaries.createdAt, startOfDay, endOfDay),
          ),
        )
        .limit(1);

      return diary || null;
    },
    [`getTodaysDiaryByUserId-${userId}`],
    {
      tags: [CACHE_TAGS.DIARIES.USER(userId)],
      revalidate: 300, // 5分キャッシュ（日付が変わるタイミングのため短め）
    },
  )();
}
