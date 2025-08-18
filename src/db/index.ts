/**
 * Drizzle ORMの中心的なエクスポートファイル
 * データベースクライアント、スキーマ、型定義をエクスポート
 */

export type { Database } from './client';
// データベースクライアント
export { closeConnection, db } from './client';

// スキーマ定義
export * from './schema';
