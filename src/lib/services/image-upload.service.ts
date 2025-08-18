/**
 * 画像アップロード関連のサービス
 */
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/storage';

/**
 * 画像アップロード用のPresigned URL生成の入力型
 */
export interface GenerateUploadUrlInput {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  bucket: 'diaries' | 'avatars'; // バケット名を指定
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
  // ファイル形式検証
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(input.fileType)) {
    throw new Error(
      'サポートされていない画像形式です。JPEG、PNG、WebPのみ対応しています。',
    );
  }

  // ファイルサイズ検証（5MB制限）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (input.fileSize > maxSize) {
    throw new Error('画像サイズは5MB以下にしてください');
  }

  // ファイルパス生成（ユーザーフォルダ + 日付構造）
  const date = new Date();
  const folderName = `${input.userId}/${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

  // ユニークファイル名生成（タイムスタンプ + ランダム）
  const timestamp = Date.now();
  const fileExtension = input.fileName.split('.').pop() || 'jpg';
  const uniqueFileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${folderName}/${uniqueFileName}`;

  // Presigned Upload URL生成
  const { data, error } = await supabaseAdmin.storage
    .from(input.bucket)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    console.error('Signed URL generation error:', error);
    throw new Error('アップロードURLの生成に失敗しました');
  }

  // 公開URL事前生成
  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(input.bucket).getPublicUrl(filePath);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl,
  };
}
