import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';

let testDbCounter = 0;

export async function createTestDatabase() {
  const dbId = `test-db-${++testDbCounter}-${Date.now()}`;

  // PGLiteインメモリインスタンス作成
  const pgliteClient = new PGlite();
  const testDb = drizzle(pgliteClient, { schema });

  // Drizzle pushSchemaをdynamic importで使用 (Vitest対応)
  await applyDrizzleSchema(testDb);

  // 統合テスト環境では詳細ログを抑制
  if (process.env.LOG_LEVEL !== 'error') {
    console.log(`✓ Test database ${dbId} created with Drizzle schema`);
  }

  return {
    testDb,
    pgliteClient,
    dbId,
    cleanup: async () => {
      await pgliteClient.close();
    },
  };
}

/**
 * Drizzleスキーマ適用 (Node.js互換性対応)
 */
async function applyDrizzleSchema(db: ReturnType<typeof drizzle>) {
  try {
    // dynamic importでdrizzle-kit/apiを読み込み
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const { pushSchema } = require('drizzle-kit/api');

    const { apply } = await pushSchema(schema, db);
    await apply();
  } catch (error) {
    console.error('Failed to apply Drizzle schema:', error);
    throw error;
  }
}
