import * as Sentry from '@sentry/nextjs';
import { storage } from '@/lib/storage/client';

interface UploadProfileImageResult {
  url: string | null;
  error: string | null;
}

/**
 * URLから画像をダウンロードしてオブジェクトストレージ（MinIO / R2）にアップロードする
 *
 * @param imageUrl - ダウンロードする画像のURL
 * @param userId - ユーザーID（ファイル名に使用）
 * @returns アップロードされた画像の公開URLまたはエラー
 */
export async function uploadProfileImageFromUrl(
  imageUrl: string,
  userId: string,
): Promise<UploadProfileImageResult> {
  try {
    // 画像をダウンロード
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Content-Typeをチェック
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid content type: not an image');
    }

    // ファイル形式から拡張子を決定
    const extension = getImageExtension(contentType);
    if (!extension) {
      throw new Error(`Unsupported image type: ${contentType}`);
    }

    // Blobに変換
    const blob = await response.blob();

    // ファイルサイズをチェック（5MB以下）
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('Image size exceeds 5MB limit');
    }

    // ファイル名を生成（タイムスタンプを含めて重複を回避）
    const timestamp = Date.now();
    const fileName = `${userId}/profile-${timestamp}.${extension}`;

    // Storageにアップロード
    const { data, error } = await storage.avatars.upload(fileName, blob, {
      contentType,
      upsert: true, // 既存のファイルがあれば上書き
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Upload failed: No data returned');
    }

    // 公開URLを生成
    const publicUrlResult = await storage.avatars.getPublicUrl(data.path);

    // アップロード成功後、古い画像を削除（非同期で実行）
    deleteOldProfileImages(userId).catch((error) => {
      console.error('Failed to delete old profile images:', error);
      // 古い画像の削除に失敗してもエラーにはしない
    });

    return {
      url: publicUrlResult.data.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Failed to upload profile image:', error);

    // Sentryにエラーを送信（コンテキスト情報付き）
    Sentry.captureException(error, {
      tags: {
        service: 'profile-image-upload',
        userId,
      },
      extra: {
        imageUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Content-Typeから画像の拡張子を取得
 */
function getImageExtension(contentType: string): string | null {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return mimeToExt[contentType] || null;
}

/**
 * 古いプロフィール画像を削除する（オプション）
 *
 * @param userId - ユーザーID
 */
export async function deleteOldProfileImages(userId: string): Promise<void> {
  try {
    // ユーザーのディレクトリ内のファイルを一覧取得
    const { data: files, error: listError } = await storage.avatars.list(
      `${userId}`,
      {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }, // 新しい順に並べ替え
      },
    );

    if (listError) {
      console.error('Failed to list profile images:', listError);
      return;
    }

    if (!files || files.length <= 1) {
      return; // 削除するファイルがない
    }

    // 最新のファイル（最初の1つ）以外を削除
    const filesToDelete = files
      .slice(1) // 最初の1つをスキップ
      .map((file) => `${userId}/${file.name}`);

    console.log(
      `Deleting ${filesToDelete.length} old profile images for user ${userId}`,
    );

    const { error: deleteError } = await storage.avatars.remove(filesToDelete);

    if (deleteError) {
      console.error('Failed to delete old profile images:', deleteError);
    } else {
      console.log(`Successfully deleted old profile images for user ${userId}`);
    }
  } catch (error) {
    console.error('Error in deleteOldProfileImages:', error);
  }
}
