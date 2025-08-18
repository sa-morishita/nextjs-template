import { resolve } from 'node:path';
import { config } from 'dotenv';

// GITHUB_ACTIONS環境変数はCI環境でデフォルトでtrueに設定される
// これが存在しない場合（＝ローカル環境）のみdotenvを実行する
if (!process.env.GITHUB_ACTIONS) {
  const envPath = resolve(process.cwd(), '.env.test.local');
  const result = config({ path: envPath });

  if (result.error) {
    console.warn(
      `Could not load .env.test.local file at ${envPath}`,
      result.error,
    );
  }
}
