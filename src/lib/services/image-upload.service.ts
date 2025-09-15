/**
 * 画像アップロード関連のサービス
 */
import 'server-only';
import {
  type BucketName,
  validateFile,
} from '@/lib/domain/storage/bucket-config';
import { storage } from '@/lib/storage/client';

/**
 * 画像アップロード用のPresigned URL生成の入力型
 */
export interface GenerateUploadUrlInput {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  bucket: BucketName; // バケット名を指定
}

/**
 * 画像アップロード用のPresigned URL生成結果型
 */
export interface GenerateUploadUrlResult {
  signedUrl: string;
  token: string;
  path: string;
  publicUrl: string;
}

/**
 * 画像アップロード用Presigned URL生成
 * - ファイル形式・サイズ検証
 * - ユニークなファイルパス生成（ユーザー別フォルダ構造）
 * - Presigned URL生成
 */
export async function generateUploadUrl(
  input: GenerateUploadUrlInput,
): Promise<GenerateUploadUrlResult> {
  // バケット設定に基づいたファイル検証
  const validation = validateFile(input.bucket, {
    type: input.fileType,
    size: input.fileSize,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // ファイルパス生成（ユーザーフォルダ + 日付構造）
  const date = new Date();
  const folderName = `${input.userId}/${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

  // ユニークファイル名生成（タイムスタンプ + ランダム）
  const timestamp = Date.now();
  const fileExtension = input.fileName.split('.').pop() || 'jpg';
  const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${folderName}/${uniqueFileName}`;

  // バケットに応じたストレージクライアントを選択
  const storageInstance = storage[input.bucket];

  // Presigned Upload URL生成
  const data = await storageInstance.createSignedUploadUrl(filePath);

  // 公開URL事前生成
  const publicUrlResult = await storageInstance.getPublicUrl(data.path);
  const publicUrl = publicUrlResult.data.publicUrl;

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl,
  };
}
