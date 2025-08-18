import { z } from 'zod';
import { UPLOAD_MESSAGES, UPLOAD_VALIDATION } from '@/lib/domain/upload';

/**
 * ファイルアップロード用Presigned URL取得スキーマ
 */
export const getSignedUploadUrlSchema = z.object({
  fileName: z.string().min(1, UPLOAD_MESSAGES.NO_FILE_SELECTED),
  fileType: z.string().min(1, UPLOAD_MESSAGES.INVALID_FILE_TYPE),
  fileSize: z
    .number()
    .min(1, UPLOAD_MESSAGES.FILE_TOO_SMALL)
    .max(UPLOAD_VALIDATION.MAX_FILE_SIZE, UPLOAD_MESSAGES.FILE_TOO_LARGE),
});

// 型のエクスポート
export type GetSignedUploadUrlInput = z.infer<typeof getSignedUploadUrlSchema>;
