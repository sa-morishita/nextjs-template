import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * 統合テスト（結合テスト）用の Vitest 設定
 *
 * 実行コマンド:
 * - `pnpm test:integration` - 統合テストを実行
 * - `pnpm test:integration:watch` - 統合テストをwatch mode で実行
 * - `pnpm test:all` - ユニットテスト + 統合テストを順次実行
 *
 * 対象ファイル: glob pattern *.integration.test.ts のみ
 *
 * 特徴:
 * - Node.js環境で実行（PGLite使用のため）
 * - Drizzle ORM + PGLiteでインメモリDBテスト
 * - server-only モジュールをモック化
 * - @praha/drizzle-factory サポート
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: 'integration',
    environment: 'node',
    testTimeout: 30000,
    globals: true,
    include: ['**/*.integration.test.ts'],
    exclude: ['work/**', 'node_modules'],
    setupFiles: [
      './src/test/integration-setup-env.ts',
      './src/test/integration-setup.ts',
    ],
    reporters: process.env.GITHUB_ACTIONS
      ? ['dot', 'github-actions']
      : ['verbose'],
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
