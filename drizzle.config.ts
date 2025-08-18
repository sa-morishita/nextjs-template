import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// .env.local ファイルを明示的に読み込み（ローカル環境のみ）
// CI環境では環境変数が直接設定されているのでスキップ
if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
  config({ path: resolve(process.cwd(), '.env.local') });
}

// DATABASE_URLの検証
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // drizzle-kit push用設定（SQLファイル生成不要）
  verbose: true,
  strict: !process.env.CI, // CI環境では自動実行、ローカルでは確認プロンプト表示
});
