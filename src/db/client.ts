// CLIスクリプト実行時はserver-onlyチェックをスキップ
if (!process.env.CLI_MODE) {
  require('server-only');
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/app/env.mjs';
import * as schema from './schema';

/**
 * PostgreSQL 接続クライアント
 * Better Authとは独立した接続を使用
 */
const queryClient = postgres(env.DATABASE_URL, {
  max: 10, // 最大接続数
  idle_timeout: 20, // アイドルタイムアウト（秒）
  connect_timeout: 10, // 接続タイムアウト（秒）
  prepare: false, // Transaction mode poolerでは無効化が必要
  // SSL設定: 本番環境（httpsで始まる）のみSSLを有効化
  ssl: env.NEXT_PUBLIC_SITE_URL.startsWith('https')
    ? 'require' // 本番環境ではSSL必須
    : false, // ローカル開発環境（http://localhost）はSSL無効
});

/**
 * Drizzle ORM インスタンス
 * アプリケーションデータの操作に使用
 */
export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV === 'development', // 開発環境でクエリログを出力
});

/**
 * 型定義
 */
export type Database = typeof db;

/**
 * テストやバッチ処理で使用する場合のクライアント終了処理
 */
export async function closeConnection() {
  await queryClient.end();
}
