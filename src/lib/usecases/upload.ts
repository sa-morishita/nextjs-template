import 'server-only';
import { returnValidationErrors } from 'next-safe-action';
import type { z } from 'zod';
import {
  isAllowedImageType,
  isValidFileSize,
  UPLOAD_MESSAGES,
} from '@/lib/domain/upload';
import { getSignedUploadUrlSchema } from '@/lib/schemas/upload';
import { generateUploadUrl } from '@/lib/services/image-upload.service';

interface UsecaseContext {
  userId: string;
}

export type GenerateUploadUrlInput = z.infer<typeof getSignedUploadUrlSchema>;

interface UploadUrlResult {
  url: string;
  headers: Record<string, string>;
  publicUrl: string;
  expiresAt: string;
  path: string;
}

export async function generateDiaryImageUploadUrl(
  input: GenerateUploadUrlInput,
  context: UsecaseContext,
): Promise<UploadUrlResult> {
  const { fileName, fileType, fileSize } = input;
  const { userId } = context;

  if (!isAllowedImageType(fileType)) {
    returnValidationErrors(getSignedUploadUrlSchema, {
      fileType: {
        _errors: [UPLOAD_MESSAGES.INVALID_FILE_TYPE],
      },
    });
  }

  if (!isValidFileSize(fileSize)) {
    returnValidationErrors(getSignedUploadUrlSchema, {
      fileSize: {
        _errors: [UPLOAD_MESSAGES.FILE_TOO_LARGE],
      },
    });
  }

  const { url, headers, publicUrl, expiresAt, path } = await generateUploadUrl({
    userId,
    fileName,
    fileType,
    fileSize,
    prefix: 'diaries',
  });

  return {
    url,
    headers,
    publicUrl,
    expiresAt,
    path,
  };
}
