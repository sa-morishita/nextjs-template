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

// 必須環境変数のチェック（ローカル環境のみ）
if (!process.env.GITHUB_ACTIONS && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY is required for storage tests.\n' +
      'Please create .env.test.local file with the following variables:\n' +
      '- SUPABASE_SERVICE_ROLE_KEY\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      'You can get these values by running: supabase status',
  );
  process.exit(1);
}
