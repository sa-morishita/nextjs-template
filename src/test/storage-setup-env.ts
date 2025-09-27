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

// ストレージテスト用のデフォルト値を補完
process.env.MINIO_ENDPOINT ||= 'http://127.0.0.1:9000';
process.env.MINIO_BUCKET ||= 'app';
process.env.MINIO_ACCESS_KEY ||= 'minioadmin';
process.env.MINIO_SECRET_KEY ||= 'minioadmin';
process.env.MINIO_PUBLIC_BASE_URL ||= `${process.env.MINIO_ENDPOINT?.replace(/\/$/, '')}/app`;
process.env.USE_R2 ||= 'false';
