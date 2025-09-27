import 'server-only';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PREFIX_CONFIGS,
  type PrefixName,
} from '@/lib/domain/storage/prefix-config';
import { storageSettings } from '@/lib/storage/settings';

const s3Client = new S3Client({
  endpoint:
    storageSettings.mode === 'r2'
      ? storageSettings.r2!.endpoint
      : storageSettings.minio.endpoint,
  region: storageSettings.mode === 'r2' ? 'auto' : 'us-east-1',
  forcePathStyle: storageSettings.mode === 'minio',
  credentials: {
    accessKeyId:
      storageSettings.mode === 'r2'
        ? storageSettings.r2!.accessKeyId
        : storageSettings.minio.accessKey,
    secretAccessKey:
      storageSettings.mode === 'r2'
        ? storageSettings.r2!.secretAccessKey
        : storageSettings.minio.secretKey,
  },
});

export interface StorageUploadResult {
  data: { path: string } | null;
  error: Error | null;
}

export interface StoragePublicUrlResult {
  data: { publicUrl: string };
}

export interface StorageListResultItem {
  name: string;
  path: string;
  created_at?: string;
  updated_at?: string;
}

export interface StorageListResult {
  data: StorageListResultItem[] | null;
  error: Error | null;
}

export interface StorageRemoveResult {
  data: Array<{ name: string }> | null;
  error: Error | null;
}

export interface SignedUploadPayload {
  url: string;
  headers: Record<string, string>;
  path: string;
  expiresAt: string;
}

interface SignedUploadOptions {
  contentType: string;
  expiresInSeconds?: number;
}

async function toBuffer(
  body: File | Blob | Buffer,
): Promise<Buffer | Uint8Array> {
  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return body;
  }

  if (typeof (body as Blob).arrayBuffer === 'function') {
    const arrayBuffer = await (body as Blob).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error('Unsupported file body type for storage upload');
}

function stripPrefix(value: string, prefix: string): string {
  if (!prefix) return value;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export class UnifiedStorage {
  constructor(private readonly prefixName: string) {}

  private resolveBucket(): string {
    return storageSettings.resolveBucketName(this.prefixName);
  }

  private resolveKey(path: string): string {
    return storageSettings.resolveObjectKey(this.prefixName, path);
  }

  private resolvePrefix(path?: string): string {
    const normalizedPath = path ? path.replace(/^\/+|\/+$/g, '') : '';

    if (!normalizedPath) {
      return storageSettings
        .resolveObjectKey(this.prefixName, '')
        .replace(/\/?$/, '/');
    }

    return storageSettings.resolveObjectKey(
      this.prefixName,
      `${normalizedPath}/`,
    );
  }

  async upload(
    path: string,
    file: File | Blob | Buffer,
    options?: { contentType?: string; upsert?: boolean },
  ): Promise<StorageUploadResult> {
    try {
      const { bucketName, objectKey, body } = await this.prepareUpload(
        path,
        file,
      );

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: body,
        ContentType: options?.contentType,
      });

      await s3Client.send(command);

      return { data: { path }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async createSignedUploadUrl(
    path: string,
    options: SignedUploadOptions,
  ): Promise<SignedUploadPayload> {
    const bucketName = this.resolveBucket();
    const objectKey = this.resolveKey(path);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: options.contentType,
    });

    const expiresIn = options.expiresInSeconds ?? 600; // default 10 minutes

    const url = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return {
      url,
      headers: {
        'Content-Type': options.contentType,
      },
      path,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  async getPublicUrl(path: string): Promise<StoragePublicUrlResult> {
    const publicUrl = storageSettings.buildPublicUrl(this.prefixName, path);

    return {
      data: { publicUrl },
    };
  }

  async list(
    path?: string,
    options?: {
      limit?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    },
  ): Promise<StorageListResult> {
    try {
      const prefix = this.resolvePrefix(path);
      const command = new ListObjectsV2Command({
        Bucket: this.resolveBucket(),
        Prefix: prefix,
        MaxKeys: options?.limit ?? 100,
      });

      const response = await s3Client.send(command);
      const basePrefix = storageSettings.resolveObjectKey(this.prefixName, '');

      const items =
        response.Contents?.flatMap((object) => {
          const key = object.Key ?? '';
          if (!key || key.endsWith('/')) {
            return [];
          }

          const relativeKey = stripPrefix(key, basePrefix);

          if (!relativeKey) {
            return [];
          }

          const segments = relativeKey.split('/');
          const name = segments[segments.length - 1] ?? relativeKey;

          return [
            {
              name,
              path: relativeKey,
              created_at: object.LastModified?.toISOString(),
              updated_at: object.LastModified?.toISOString(),
            },
          ];
        }) ?? [];

      if (options?.sortBy?.column === 'created_at') {
        items.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

          return options.sortBy?.order === 'desc'
            ? dateB - dateA
            : dateA - dateB;
        });
      }

      return { data: items, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async remove(paths: string[]): Promise<StorageRemoveResult> {
    try {
      const bucketName = this.resolveBucket();
      const objects = paths.map((path) => ({ Key: this.resolveKey(path) }));

      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects },
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

  private async prepareUpload(
    path: string,
    file: File | Blob | Buffer,
  ): Promise<{
    bucketName: string;
    objectKey: string;
    body: Buffer | Uint8Array;
  }> {
    const bucketName = this.resolveBucket();
    const objectKey = this.resolveKey(path);
    const body = await toBuffer(file);

    return {
      bucketName,
      objectKey,
      body,
    };
  }
}

export const storage = Object.fromEntries(
  Object.keys(PREFIX_CONFIGS).map((prefixKey) => [
    prefixKey,
    new UnifiedStorage(prefixKey),
  ]),
) as Record<PrefixName, UnifiedStorage>;

// 新しいプレフィックス（例: documents/）を使いたい場合は prefix-config.ts の PREFIX_CONFIGS に定義を追加するだけでOK。
// 実際には MinIO / R2 の共有バケット `app` 配下に `${prefix}/...` というキーで保存される。
