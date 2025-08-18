import { defineConfig } from 'drizzle-kit';

/**
 * PGLite用Drizzle設定
 * テスト環境での drizzle-kit push 使用
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  driver: 'pglite',
  dbCredentials: {
    url: ':memory:', // インメモリPGLite
  },
  verbose: true,
  strict: false, // テスト環境では柔軟性重視
});
