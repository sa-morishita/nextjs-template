import { vi } from 'vitest';

// 統合テスト用のモック設定

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn, // キャッシュを無効化してテスト実行
  revalidateTag: vi.fn(),
}));

// Mock LINE distribution service for articles
vi.mock('@/lib/services/article-line-distribution', () => ({
  distributeArticleToLine: vi.fn().mockResolvedValue({ success: true }),
}));

// Database mock setup (テストファイルで設定)
let testDbInstance: ReturnType<
  typeof import('drizzle-orm/pglite').drizzle
> | null = null;

vi.mock('@/db', () => ({
  get db() {
    return testDbInstance;
  },
}));

// Export for use in test files
export { testDbInstance };
export const setTestDbInstance = (instance: typeof testDbInstance) => {
  testDbInstance = instance;
};
