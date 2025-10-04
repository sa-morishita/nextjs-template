'use server';

import { revalidateTag } from 'next/cache';
import { flattenValidationErrors } from 'next-safe-action';
import { createDiaryFormSchema } from '@/lib/sample/schemas/diary';
import { createDiaryUsecase } from '@/lib/sample/usecases/diary';
import { getSignedUploadUrlSchema } from '@/lib/schemas/upload';
import { generateDiaryImageUploadUrl } from '@/lib/usecases/upload';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';
import { privateActionClient } from '@/lib/utils/safe-action';

export const createDiaryAction = privateActionClient
  .metadata({ actionName: 'createDiary' })
  .inputSchema(createDiaryFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    await createDiaryUsecase(parsedInput, { userId });

    revalidateTag(CACHE_TAGS.DIARIES.USER(userId));
  });

export const getSignedUploadUrlAction = privateActionClient
  .metadata({ actionName: 'getDiaryImageUploadUrl' })
  .inputSchema(getSignedUploadUrlSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    return generateDiaryImageUploadUrl(parsedInput, { userId });
  });
