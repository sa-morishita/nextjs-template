#!/usr/bin/env tsx
import path from 'node:path';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// .env.localを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// データベース接続
const connectionString = process.env.DATABASE_URL || '';
const sqlClient = postgres(connectionString, { max: 1 });
const db = drizzle(sqlClient);

async function setupRLS() {
  console.log('🔒 Setting up Row Level Security (RLS) for all tables...');

  try {
    // 現在のpublicスキーマにある全てのテーブルを取得
    const result = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    `);

    const tables = result.map(
      (row) => (row as { tablename: string }).tablename,
    );

    console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}`);

    for (const tableName of tables) {
      // RLSを有効化
      await db.execute(
        sql.raw(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`),
      );

      // 既存のポリシーがあるかチェック
      const existingPolicy = await db.execute(sql`
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = ${tableName}
        AND policyname = ${`Deny all access to ${tableName}`}
      `);

      // ポリシーが存在しない場合のみ作成
      if (existingPolicy.length === 0) {
        await db.execute(
          sql.raw(`
          CREATE POLICY "Deny all access to ${tableName}"
          ON "${tableName}"
          FOR ALL
          USING (false);
        `),
        );
      }

      console.log(`✅ RLS enabled for table: ${tableName}`);
    }

    console.log('🎉 RLS setup completed successfully!');
    console.log('📝 All tables are now protected with RLS');
    console.log(
      '🔑 Only service role key can access these tables from server-side',
    );
  } catch (error) {
    console.error('❌ RLS setup failed:', error);
    throw error;
  } finally {
    await sqlClient.end();
  }
}

// スクリプトとして直接実行された場合のみ実行
if (require.main === module) {
  setupRLS()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { setupRLS };
