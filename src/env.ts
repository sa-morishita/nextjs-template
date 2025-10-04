import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * サーバーサイド環境変数（クライアントではアクセス不可）
   * クライアントでアクセスするとエラーになります
   */
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1), // メール認証用

    // LINE Login（オプション）
    LINE_LOGIN_CHANNEL_ID: z.string().optional(),
    LINE_LOGIN_CHANNEL_SECRET: z.string().optional(),

    // MinIO設定（開発環境）
    MINIO_ENDPOINT: z.url().default('http://127.0.0.1:9000'),
    MINIO_BUCKET: z.string().min(1).default('app'),
    MINIO_ACCESS_KEY: z.string().min(1).default('minioadmin'),
    MINIO_SECRET_KEY: z.string().min(1).default('minioadmin'),
    MINIO_PUBLIC_BASE_URL: z.url().optional(),

    // ストレージ切り替え
    USE_R2: z.enum(['true', 'false']).default('false'),

    // Cloudflare R2設定（本番環境）
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_BASE_URL: z.url().optional(),
  },

  /**
   * クライアント環境変数（クライアントとサーバーの両方で利用可能）
   * NEXT_PUBLIC_プレフィックスが必須です
   */
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
  },

  /**
   * Next.jsのEdgeとClientでの環境変数バンドルのため、
   * 手動でデストラクチャリングする必要があります
   *
   * server と client の全変数をここに含める必要があります
   */
  runtimeEnv: {
    // Server variables
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LINE_LOGIN_CHANNEL_ID: process.env.LINE_LOGIN_CHANNEL_ID,
    LINE_LOGIN_CHANNEL_SECRET: process.env.LINE_LOGIN_CHANNEL_SECRET,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_PUBLIC_BASE_URL: process.env.MINIO_PUBLIC_BASE_URL,
    USE_R2: process.env.USE_R2,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,

    // Client variables
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
});
