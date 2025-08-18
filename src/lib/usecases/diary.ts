/**
 * Diary関連のUsecases
 */
import 'server-only';
import { returnValidationErrors } from 'next-safe-action';
import type { z } from 'zod';
import {
  DIARY_MESSAGES,
  DIARY_STATUS,
  DIARY_TYPE,
  isValidDiaryContent,
  isValidDiaryTitle,
} from '@/lib/domain/diary';
import { createDiary } from '@/lib/mutations/diaries';
import { getTodaysDiaryByUserId } from '@/lib/queries/diaries';
import { createDiaryFormSchema } from '@/lib/schemas/diary';

/**
 * Usecase Context
 */
interface UsecaseContext {
  userId: string;
}

/**
 * 日記作成の入力型
 */
export type CreateDiaryInput = z.infer<typeof createDiaryFormSchema>;

/**
 * 日記作成のビジネスロジック
 * - タイトルとコンテンツの妥当性チェック
 * - 1日1日記ルールのチェック
 * - 日記作成
 */
export async function createDiaryUsecase(
  input: CreateDiaryInput,
  context: UsecaseContext,
): Promise<void> {
  const { title, content, imageUrl } = input;
  const { userId } = context;

  // タイトルの妥当性チェック
  if (!isValidDiaryTitle(title)) {
    returnValidationErrors(createDiaryFormSchema, {
      title: {
        _errors: [DIARY_MESSAGES.TITLE_INVALID_CHARS],
      },
    });
  }

  // コンテンツの妥当性チェック
  if (!isValidDiaryContent(content)) {
    returnValidationErrors(createDiaryFormSchema, {
      content: {
        _errors: [DIARY_MESSAGES.CONTENT_INVALID_CHARS],
      },
    });
  }

  // 1日1日記ルールのチェック
  const todaysDiary = await getTodaysDiaryByUserId(userId);
  if (todaysDiary) {
    returnValidationErrors(createDiaryFormSchema, {
      _errors: [DIARY_MESSAGES.ALREADY_EXISTS_TODAY],
    });
  }

  // 日記を作成
  await createDiary({
    userId,
    title,
    content,
    imageUrl: imageUrl || undefined,
    status: DIARY_STATUS.PUBLISHED,
    type: DIARY_TYPE.DIARY,
  });
}
