/**
 * DiaryForm Container Component
 *
 * セッションを確認してユーザーIDを取得し、
 * 当日の日記が既に存在するかを確認してPresentational Componentに渡す
 */
import { getTodaysDiaryByUserId } from '@/lib/queries/diaries';
import { getSession } from '@/lib/services/auth';
import { DiaryFormPresentational } from './presentational';

export async function DiaryFormContainer() {
  // セッション取得（認証チェック付き）
  const session = await getSession();

  // 当日の日記が既に存在するかチェック
  const todaysDiary = await getTodaysDiaryByUserId(session.user.id);

  return <DiaryFormPresentational hasTodaysDiary={!!todaysDiary} />;
}
