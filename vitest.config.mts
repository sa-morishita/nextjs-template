import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

/**
 * ユニットテスト用の Vitest 設定
 *
 * 実行コマンド:
 * - `pnpm test` または `pnpm test:unit` - ユニットテストを実行
 * - `pnpm test:watch` または `pnpm test:unit:watch` - ユニットテストをwatch mode で実行
 *
 * 対象ファイル: glob pattern *.test.ts, *.test.tsx (統合テストは除外)
 * 除外ファイル: glob pattern *.integration.test.ts (統合テストは別設定で実行)
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [
      '**/*.integration.test.ts',
      '**/*.storage.test.ts',
      '**/*.spec.ts', // Playwright E2E tests
      'e2e/**', // Playwright E2E test directory
      'node_modules',
      'work/**',
    ],
    reporters: process.env.GITHUB_ACTIONS
      ? ['dot', 'github-actions']
      : ['verbose'],
  },
});
