import 'server-only';
import { returnValidationErrors } from 'next-safe-action';
import type { z } from 'zod';
import {
  adjustDateToEndOfDay,
  DIARY_MESSAGES,
  DIARY_STATUS,
  DIARY_TYPE,
  type DiaryFilters,
  isValidDiaryContent,
  isValidDiaryTitle,
} from '@/lib/sample/domain/diary';
import { createDiary } from '@/lib/sample/mutations/diaries';
import {
  getTodaysDiaryByUserId,
  getUserDiaries,
} from '@/lib/sample/queries/diaries';
import { createDiaryFormSchema } from '@/lib/sample/schemas/diary';

interface UsecaseContext {
  userId: string;
}

export type CreateDiaryInput = z.infer<typeof createDiaryFormSchema>;

export async function createDiaryUsecase(
  input: CreateDiaryInput,
  context: UsecaseContext,
): Promise<void> {
  const { title, content, imageUrl, blurDataUrl } = input;
  const { userId } = context;

  if (!isValidDiaryTitle(title)) {
    returnValidationErrors(createDiaryFormSchema, {
      title: {
        _errors: [DIARY_MESSAGES.TITLE_INVALID_CHARS],
      },
    });
  }

  if (!isValidDiaryContent(content)) {
    returnValidationErrors(createDiaryFormSchema, {
      content: {
        _errors: [DIARY_MESSAGES.CONTENT_INVALID_CHARS],
      },
    });
  }

  const todaysDiary = await getTodaysDiaryByUserId(userId);
  if (todaysDiary) {
    returnValidationErrors(createDiaryFormSchema, {
      _errors: [DIARY_MESSAGES.ALREADY_EXISTS_TODAY],
    });
  }

  await createDiary({
    userId,
    title,
    content,
    imageUrl: imageUrl || undefined,
    blurDataUrl: blurDataUrl || undefined,
    status: DIARY_STATUS.PUBLISHED,
    type: DIARY_TYPE.DIARY,
  });
}

export async function getDiaryListUsecase(
  filters: DiaryFilters,
  context: UsecaseContext,
) {
  const { userId } = context;

  const adjustedFilters: DiaryFilters = {
    ...filters,
    dateTo: filters.dateTo ? adjustDateToEndOfDay(filters.dateTo) : undefined,
  };

  return getUserDiaries(userId, adjustedFilters);
}

export async function checkTodaysDiaryUsecase(
  context: UsecaseContext,
): Promise<boolean> {
  const { userId } = context;
  const diary = await getTodaysDiaryByUserId(userId);
  return !!diary;
}
