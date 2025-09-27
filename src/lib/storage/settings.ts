import { env } from '@/app/env.mjs';

type StorageMode = 'minio' | 'r2';

const useR2 = env.USE_R2 === 'true';

const mode: StorageMode = useR2 ? 'r2' : 'minio';

const minioEndpoint = env.MINIO_ENDPOINT.replace(/\/$/, '');
const minioBucket = env.MINIO_BUCKET;
const minioPublicBase = (
  env.MINIO_PUBLIC_BASE_URL ?? `${minioEndpoint}/${minioBucket}`
).replace(/\/$/, '');

const minioConfig = {
  endpoint: minioEndpoint,
  bucket: minioBucket,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
  publicBaseUrl: minioPublicBase,
};

function ensure(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Environment variable ${name} is required when USE_R2=true`,
    );
  }
  return value;
}

const r2Config = useR2
  ? (() => {
      const accountId = ensure(env.R2_ACCOUNT_ID, 'R2_ACCOUNT_ID');
      const bucket = ensure(env.R2_BUCKET, 'R2_BUCKET');
      return {
        accountId,
        bucket,
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        accessKeyId: ensure(env.R2_ACCESS_KEY_ID, 'R2_ACCESS_KEY_ID'),
        secretAccessKey: ensure(
          env.R2_SECRET_ACCESS_KEY,
          'R2_SECRET_ACCESS_KEY',
        ),
        publicBaseUrl: ensure(
          env.R2_PUBLIC_BASE_URL,
          'R2_PUBLIC_BASE_URL',
        ).replace(/\/$/, ''),
      } as const;
    })()
  : null;

function joinObjectKey(logicalBucket: string, key: string): string {
  const trimmed = key.replace(/^\/+/, '');
  if (!trimmed) {
    return `${logicalBucket}/`;
  }
  return `${logicalBucket}/${trimmed}`;
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}

function resolveBucketName(prefixName: string): string {
  if (mode === 'r2') {
    return r2Config!.bucket;
  }
  return minioConfig.bucket;
}

function resolveObjectKey(prefixName: string, key: string): string {
  return joinObjectKey(prefixName, key);
}

function buildPublicUrl(prefixName: string, key: string): string {
  const objectPath = joinObjectKey(prefixName, key).replace(/\/$/, '');
  const base =
    mode === 'r2' ? r2Config!.publicBaseUrl : minioConfig.publicBaseUrl;
  return joinUrl(base, objectPath);
}

export const storageSettings = {
  mode,
  minio: minioConfig,
  r2: r2Config,
  resolveBucketName,
  resolveObjectKey,
  buildPublicUrl,
};

export type { StorageMode };
