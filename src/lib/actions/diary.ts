'use server';

import { revalidateTag } from 'next/cache';
import { flattenValidationErrors } from 'next-safe-action';
import { createDiaryFormSchema } from '@/lib/schemas';
import { getSignedUploadUrlSchema } from '@/lib/schemas/upload';
import { createDiaryUsecase } from '@/lib/usecases/diary';
import { generateDiaryImageUploadUrl } from '@/lib/usecases/upload';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';
import { privateActionClient } from '@/lib/utils/safe-action';

export const createDiaryAction = privateActionClient
  .metadata({ actionName: 'createDiary' })
  .inputSchema(createDiaryFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し（ビジネスロジックはUsecaseに委譲）
    await createDiaryUsecase(parsedInput, { userId });

    revalidateTag(CACHE_TAGS.DIARIES.USER(userId));
  });

/**
 * 日記画像アップロード用Presigned URL生成Server Action
 */
export const getSignedUploadUrlAction = privateActionClient
  .metadata({ actionName: 'getDiaryImageUploadUrl' })
  .inputSchema(getSignedUploadUrlSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し（ビジネスロジックはUsecaseに委譲）
    const result = await generateDiaryImageUploadUrl(parsedInput, { userId });

    return result;
  });
