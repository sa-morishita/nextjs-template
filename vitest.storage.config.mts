import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * Storage結合テスト用の Vitest 設定
 *
 * 実行コマンド:
 * - `pnpm test:storage` - Storage結合テストを実行
 * - `pnpm test:storage:watch` - Storage結合テストをwatch mode で実行
 *
 * 対象ファイル: glob pattern *.storage.test.ts のみ
 *
 * 特徴:
 * - Node.js環境で実行（S3互換API使用のため）
 * - ローカルMinIOまたはR2に接続
 * - 実際のファイルアップロード/ダウンロードをテスト
 * - テスト用バケットを使用して本番データと分離
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: 'storage',
    environment: 'node',
    testTimeout: 30000,
    globals: true,
    include: ['**/*.storage.test.ts'],
    exclude: ['work/**', 'node_modules'],
    reporters: process.env.GITHUB_ACTIONS
      ? ['dot', 'github-actions']
      : ['verbose'],
    setupFiles: [
      './src/test/storage-setup-env.ts',
      './src/test/storage-setup.ts',
    ],
  },
  // drizzle-kit/api のNode.js互換性設定
  define: {
    global: 'globalThis',
  },
  ssr: {
    noExternal: ['drizzle-kit'],
  },
  resolve: {
    alias: {
      'server-only': path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        'src/test/mocks/server-only.ts',
      ),
    },
  },
});
