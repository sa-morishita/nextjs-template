import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

/**
 * Storage結合テスト用のセットアップ
 * ローカルSupabaseインスタンスとの接続を設定
 */

// グローバルfetchのタイムアウト設定
if (!global.fetch) {
  // Node.js 18以降ではfetchがビルトインなので、この処理は不要かもしれません
  console.info('Native fetch is available');
}

// Service Role Keyを使用したテスト用クライアントをエクスポート
// 環境変数は storage-setup-env.ts で読み込まれている
export const testSupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55077',
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// コンソール出力のモック（必要に応じて）
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
