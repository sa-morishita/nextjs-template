import 'server-only';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/app/env.mjs';

// ローカル環境判定（開発・テスト環境でMinIOを使用）
const isLocal =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMinIO = isLocal && env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost');

// Supabaseクライアント
export const supabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// S3/MinIOクライアント（開発環境用）
export const s3Client = new S3Client({
  endpoint: isMinIO ? env.NEXT_PUBLIC_SUPABASE_URL : undefined,
  region: isMinIO ? 'us-east-1' : 'auto',
  credentials: isMinIO
    ? {
        accessKeyId: 'minioadmin',
        secretAccessKey: env.SUPABASE_SERVICE_ROLE_KEY || 'minioadmin',
      }
    : undefined,
  forcePathStyle: isMinIO, // MinIO必須設定
});

// 統一Storageインターface
export interface StorageUploadResult {
  data: { path: string } | null;
  error: Error | null;
}

export interface StoragePublicUrlResult {
  data: { publicUrl: string };
}

export interface StorageListResult {
  data: Array<{
    name: string;
    id?: string;
    created_at?: string;
    updated_at?: string;
  }> | null;
  error: Error | null;
}

export interface StorageRemoveResult {
  data: Array<{ name: string }> | null;
  error: Error | null;
}

// バケット操作の統一クラス
export class UnifiedStorage {
  constructor(private bucketName: string) {}

  async upload(
    path: string,
    file: File | Blob | Buffer,
    options?: { contentType?: string; upsert?: boolean },
  ): Promise<StorageUploadResult> {
    if (isMinIO) {
      return this.uploadToS3(path, file, options);
    } else {
      return this.uploadToSupabase(path, file, options);
    }
  }

  async createSignedUploadUrl(path: string): Promise<{
    signedUrl: string;
    token: string;
    path: string;
  }> {
    if (isMinIO) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      return {
        signedUrl,
        token: 'minio-token',
        path,
      };
    } else {
      const { data, error } = await supabaseClient.storage
        .from(this.bucketName)
        .createSignedUploadUrl(path);

      if (error) throw error;
      return data;
    }
  }

  async getPublicUrl(path: string): Promise<StoragePublicUrlResult> {
    if (isMinIO) {
      return {
        data: {
          publicUrl: `${env.NEXT_PUBLIC_SUPABASE_URL}/${this.bucketName}/${path}`,
        },
      };
    } else {
      return supabaseClient.storage.from(this.bucketName).getPublicUrl(path);
    }
  }

  async list(
    path?: string,
    options?: {
      limit?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    },
  ): Promise<StorageListResult> {
    if (isMinIO) {
      return this.listFromS3(path, options);
    } else {
      return this.listFromSupabase(path, options);
    }
  }

  async remove(paths: string[]): Promise<StorageRemoveResult> {
    if (isMinIO) {
      return this.removeFromS3(paths);
    } else {
      return this.removeFromSupabase(paths);
    }
  }

  private async uploadToS3(
    path: string,
    file: File | Blob | Buffer,
    options?: { contentType?: string; upsert?: boolean },
  ): Promise<StorageUploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: file,
        ContentType: options?.contentType,
      });

      await s3Client.send(command);
      return { data: { path }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async uploadToSupabase(
    path: string,
    file: File | Blob | Buffer,
    options?: { contentType?: string; upsert?: boolean },
  ): Promise<StorageUploadResult> {
    const { data, error } = await supabaseClient.storage
      .from(this.bucketName)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert,
      });

    return { data, error };
  }

  private async listFromS3(
    path?: string,
    options?: {
      limit?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    },
  ): Promise<StorageListResult> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: path || '',
        MaxKeys: options?.limit || 100,
      });

      const response = await s3Client.send(command);

      const files =
        response.Contents?.map((item) => ({
          name: item.Key ? item.Key.split('/').pop() || '' : '',
          created_at: item.LastModified?.toISOString(),
        })) || [];

      // ソート処理
      if (options?.sortBy) {
        files.sort((a, b) => {
          if (options.sortBy?.column === 'created_at') {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return options.sortBy.order === 'desc'
              ? dateB - dateA
              : dateA - dateB;
          }
          return 0;
        });
      }

      return { data: files, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async listFromSupabase(
    path?: string,
    options?: {
      limit?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    },
  ): Promise<StorageListResult> {
    const { data, error } = await supabaseClient.storage
      .from(this.bucketName)
      .list(path, options);

    return { data, error };
  }

  private async removeFromS3(paths: string[]): Promise<StorageRemoveResult> {
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: paths.map((path) => ({ Key: path })),
        },
      });

      await s3Client.send(command);
      return {
        data: paths.map((path) => ({ name: path })),
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  private async removeFromSupabase(
    paths: string[],
  ): Promise<StorageRemoveResult> {
    const { data, error } = await supabaseClient.storage
      .from(this.bucketName)
      .remove(paths);

    return { data, error };
  }
}

import {
  BUCKET_CONFIGS,
  type BucketName,
} from '@/lib/domain/storage/bucket-config';

// バケット設定から動的にStorageインスタンスを生成
export const storage = Object.fromEntries(
  Object.keys(BUCKET_CONFIGS).map((bucketName) => [
    bucketName,
    new UnifiedStorage(bucketName),
  ]),
) as Record<BucketName, UnifiedStorage>;

// 新しいバケットを追加する手順:
// 1. bucket-config.ts の BUCKET_CONFIGS に追加（自動的にstorageに反映される）
// 2. supabase/config.toml に [storage.buckets.xxx] を追加（本番環境用）
// 3. MinIO起動時: /dev:create-storage-bucket xxx（開発環境用）
