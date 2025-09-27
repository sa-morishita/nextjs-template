/**
 * 画像アップロード関連のサービス
 */
import 'server-only';
import {
  type PrefixName,
  validateFile,
} from '@/lib/domain/storage/prefix-config';
import { storage } from '@/lib/storage/client';

/**
 * 画像アップロード用のPresigned URL生成の入力型
 */
export interface GenerateUploadUrlInput {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  prefix: PrefixName; // プレフィックス名を指定
}

/**
 * 画像アップロード用のPresigned URL生成結果型
 */
export interface GenerateUploadUrlResult {
  url: string;
  headers: Record<string, string>;
  path: string;
  publicUrl: string;
  expiresAt: string;
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
  // プレフィックス設定に基づいたファイル検証
  const validation = validateFile(input.prefix, {
    type: input.fileType,
    size: input.fileSize,
  });

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // ファイルパス生成（ユーザーフォルダ構造）
  const timestamp = Date.now();
  const folderName = `${input.userId}`;

  // ユニークファイル名生成（タイムスタンプ + ランダム）
  const fileExtension = input.fileName.split('.').pop() || 'jpg';
  const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${folderName}/${uniqueFileName}`;

  // プレフィックスに応じたストレージクライアントを選択
  const storageInstance = storage[input.prefix];

  // Presigned Upload URL生成
  const signedPayload = await storageInstance.createSignedUploadUrl(filePath, {
    contentType: input.fileType,
  });

  // 公開URL事前生成
  const publicUrlResult = await storageInstance.getPublicUrl(
    signedPayload.path,
  );
  const publicUrl = publicUrlResult.data.publicUrl;

  return {
    url: signedPayload.url,
    headers: signedPayload.headers,
    path: signedPayload.path,
    publicUrl,
    expiresAt: signedPayload.expiresAt,
  };
}
