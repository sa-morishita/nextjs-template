/**
 * アップロード関連のUsecases
 */
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

/**
 * Usecase Context
 */
interface UsecaseContext {
  userId: string;
}

/**
 * アップロードURLパラメータの入力型
 */
export type GenerateUploadUrlInput = z.infer<typeof getSignedUploadUrlSchema>;

interface UploadUrlResult {
  url: string;
  headers: Record<string, string>;
  publicUrl: string;
  expiresAt: string;
  path: string;
}

/**
 * 日記画像アップロード用のPresigned URLを生成
 */
export async function generateDiaryImageUploadUrl(
  input: GenerateUploadUrlInput,
  context: UsecaseContext,
): Promise<UploadUrlResult> {
  const { fileName, fileType, fileSize } = input;
  const { userId } = context;

  // ファイルタイプの検証
  if (!isAllowedImageType(fileType)) {
    returnValidationErrors(getSignedUploadUrlSchema, {
      fileType: {
        _errors: [UPLOAD_MESSAGES.INVALID_FILE_TYPE],
      },
    });
  }

  // ファイルサイズの検証
  if (!isValidFileSize(fileSize)) {
    returnValidationErrors(getSignedUploadUrlSchema, {
      fileSize: {
        _errors: [UPLOAD_MESSAGES.FILE_TOO_LARGE],
      },
    });
  }

  // Presigned URLの生成
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
