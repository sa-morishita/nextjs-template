import * as Sentry from '@sentry/nextjs';
import { storage } from '@/lib/storage/client';
import { logger } from '@/lib/utils/logger';

interface UploadProfileImageResult {
  url: string | null;
  error: string | null;
}

export async function uploadProfileImageFromUrl(
  imageUrl: string,
  userId: string,
): Promise<UploadProfileImageResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid content type: not an image');
    }

    const extension = getImageExtension(contentType);
    if (!extension) {
      throw new Error(`Unsupported image type: ${contentType}`);
    }

    const blob = await response.blob();
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('Image size exceeds 5MB limit');
    }

    const timestamp = Date.now();
    const fileName = `${userId}/profile-${timestamp}.${extension}`;

    const { data, error } = await storage.avatars.upload(fileName, blob, {
      contentType,
      upsert: true,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Upload failed: No data returned');
    }

    const publicUrlResult = await storage.avatars.getPublicUrl(data.path);

    deleteOldProfileImages(userId).catch((error) => {
      console.error('Failed to delete old profile images:', error);
    });

    return {
      url: publicUrlResult.data.publicUrl,
      error: null,
    };
  } catch (error) {
    console.error('Failed to upload profile image:', error);

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

function getImageExtension(contentType: string): string | null {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  return mimeToExt[contentType] || null;
}

export async function deleteOldProfileImages(userId: string): Promise<void> {
  try {
    const { data: files, error: listError } = await storage.avatars.list(
      `${userId}`,
      {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      },
    );

    if (listError) {
      console.error('Failed to list profile images:', listError);
      return;
    }

    if (!files || files.length <= 1) {
      return;
    }

    const filesToDelete = files
      .slice(1)
      .map((file) => `${userId}/${file.name}`);

    logger.info(
      `Deleting ${filesToDelete.length} old profile images for user ${userId}`,
    );

    const { error: deleteError } = await storage.avatars.remove(filesToDelete);

    if (deleteError) {
      console.error('Failed to delete old profile images:', deleteError);
    } else {
      logger.info(`Successfully deleted old profile images for user ${userId}`);
    }
  } catch (error) {
    console.error('Error in deleteOldProfileImages:', error);
  }
}
