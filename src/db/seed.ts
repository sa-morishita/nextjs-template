#!/usr/bin/env tsx
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { betterAuth } from 'better-auth';
import dotenv from 'dotenv';
import { count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { reset, seed } from 'drizzle-seed';
import { Pool } from 'pg';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// .env.localを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL が未設定のためシードを中止しました');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isDevelopment = nodeEnv === 'development';

if (nodeEnv === 'production') {
  console.error('❌ 本番環境ではシードを実行できません');
  process.exit(1);
}

let databaseUrl: URL | null = null;
try {
  databaseUrl = new URL(connectionString);
} catch {
  console.error(
    '❌ DATABASE_URL が不正な形式です。開発環境以外でのリセットを防ぐため中止します',
  );
  process.exit(1);
}

const hostname = databaseUrl?.hostname ?? '';

const isLocalHostname = (target: string) => {
  if (!target) return false;
  if (['localhost', '127.0.0.1', '::1', 'db'].includes(target)) return true;
  if (target.endsWith('.local')) return true;
  if (/^192\.168\./u.test(target)) return true;
  if (/^10\./u.test(target)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./u.test(target)) return true;
  // 拡張子を持たないホスト名（Docker ネットワークなど）はローカル扱い
  if (!target.includes('.')) return true;
  return false;
};

const isExplicitlyBlocked =
  hostname.includes('supabase.co') || hostname.includes('neon.tech');

if (!isDevelopment || !isLocalHostname(hostname) || isExplicitlyBlocked) {
  console.error(
    '❌ Reset はローカル開発環境 (NODE_ENV=development かつローカルホスト) でのみ実行できます',
  );
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

// Better Auth インスタンスを作成（ユーザー作成用）
const createAuthInstance = () => {
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!betterAuthSecret || !baseUrl) {
    throw new Error(
      'Missing BETTER_AUTH_SECRET or NEXT_PUBLIC_SITE_URL in environment variables',
    );
  }

  return betterAuth({
    database: new Pool({
      connectionString,
      ssl: baseUrl.startsWith('https') ? { rejectUnauthorized: false } : false,
    }),
    secret: betterAuthSecret,
    baseURL: baseUrl,
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // seedではメール認証をスキップ
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    advanced: {
      database: {
        generateId: () => randomUUID(), // UUID v4 生成
      },
    },
  });
};

async function main() {
  console.log('🌱 Seeding database with sample data...');

  try {
    // drizzle-seedのreset機能を使用してデータベースをリセット
    console.log('🗑️  Resetting database using drizzle-seed reset...');
    await reset(db, schema);
    console.log('✅ Database reset completed');

    // Better Auth経由でテストユーザーを作成
    console.log('👤 Creating test user via Better Auth...');
    const auth = createAuthInstance();

    const testUserEmail = 'test@example.com';
    const testUserPassword = 'TestPassword123!';
    const testUserName = 'Test User';

    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: testUserEmail,
        password: testUserPassword,
        name: testUserName,
      },
    });

    if (!signUpResult?.user) {
      throw new Error('Failed to create test user via Better Auth');
    }

    const testUserId = signUpResult.user.id;

    console.log('✅ Test user created successfully!');
    console.log(`   Email: ${testUserEmail}`);
    console.log(`   Password: ${testUserPassword}`);
    console.log(`   Name: ${testUserName}`);
    console.log(`   User ID: ${testUserId}`);

    // メール認証済みに更新
    await db
      .update(schema.user)
      .set({ emailVerified: true })
      .where(eq(schema.user.id, testUserId));
    console.log('✅ Email verified for test user');

    // drizzle-seedでサンプルデータを生成（テストユーザーに紐付け）
    console.log('📝 Generating sample data with drizzle-seed...');

    // seedに渡すスキーマを定義
    const seedSchema = {
      todos: schema.todos,
      diaries: schema.diaries,
    };

    // drizzle-seedを実行してデータを生成（すべてtestUserIdに紐付け）
    await seed(db, seedSchema, { count: 20, seed: 12345 }).refine((funcs) => ({
      todos: {
        columns: {
          id: funcs.uuid(),
          userId: funcs.default({ defaultValue: testUserId }), // すべてテストユーザーに紐付け
          title: funcs.valuesFromArray({
            values: [
              'Complete the project documentation',
              'Review code for security vulnerabilities',
              'Update the user interface design',
              'Implement the new feature',
              'Fix the reported bugs',
              'Write unit tests for the new module',
              'Optimize database queries',
              'Deploy the application to production',
              'Conduct user acceptance testing',
              'Prepare the quarterly report',
              'Schedule team meeting',
              'Update the project roadmap',
              'Review pull requests',
              'Setup monitoring and alerts',
              'Backup the database',
              'Update dependencies',
              'Refactor legacy code',
              'Create API documentation',
              'Setup CI/CD pipeline',
              'Perform load testing',
            ],
          }),
          completed: funcs.weightedRandom([
            { value: funcs.boolean(), weight: 0.3 }, // 30% completed
            { value: funcs.default({ defaultValue: false }), weight: 0.7 }, // 70% incomplete
          ]),
        },
      },
      diaries: {
        columns: {
          id: funcs.uuid(),
          userId: funcs.default({ defaultValue: testUserId }), // すべてテストユーザーに紐付け
          title: funcs.valuesFromArray({
            values: [
              '朝のコーヒータイム',
              '新しいプロジェクトのアイデア',
              '週末の散歩',
              '読書メモ: デザインパターン',
              '今日の学び',
              'チームミーティングの振り返り',
              '美味しいランチ',
              'プログラミングの発見',
              '自然の中で',
              '家族との時間',
              '新しい技術の探求',
              '趣味のプロジェクト',
              '夕焼けの風景',
              'お気に入りの音楽',
              '料理の実験',
              '友人との会話',
              '旅行の計画',
              '運動の記録',
              'アートギャラリー訪問',
              '季節の変化',
            ],
          }),
          content: funcs.loremIpsum({ sentencesCount: 5 }), // 5文のダミーテキスト
          imageUrl: funcs.valuesFromArray({
            values: Array.from(
              { length: 20 },
              (_, i) => `https://picsum.photos/seed/${i + 1}/800/600`,
            ),
          }),
          blurDataUrl: funcs.default({ defaultValue: null }),
          status: funcs.weightedRandom([
            {
              value: funcs.default({ defaultValue: 'published' }),
              weight: 0.7,
            }, // 70% published
            { value: funcs.default({ defaultValue: 'draft' }), weight: 0.2 }, // 20% draft
            { value: funcs.default({ defaultValue: 'archived' }), weight: 0.1 }, // 10% archived
          ]),
          type: funcs.weightedRandom([
            { value: funcs.default({ defaultValue: 'diary' }), weight: 0.6 }, // 60% diary
            { value: funcs.default({ defaultValue: 'note' }), weight: 0.3 }, // 30% note
            { value: funcs.default({ defaultValue: 'memo' }), weight: 0.1 }, // 10% memo
          ]),
        },
      },
    }));

    console.log('✅ Sample data created successfully with drizzle-seed');

    // RFC 4122準拠のUUIDに更新（drizzle-seedのバグ回避）
    // 注意: drizzle-seed v0.3.1 には UUID生成のバグがあります
    // 生成されるUUIDの17番目の文字（variant digit）が RFC 4122 に準拠していません
    // この問題により、Zod の z.uuid() バリデーションが失敗する可能性があります
    console.log('🔧 Updating UUIDs to be RFC 4122 compliant...');

    // TODOのUUIDを更新
    const todosToUpdate = await db
      .select({ id: schema.todos.id })
      .from(schema.todos);

    for (const todo of todosToUpdate) {
      const newId = randomUUID();
      await db
        .update(schema.todos)
        .set({ id: newId })
        .where(eq(schema.todos.id, todo.id));
    }
    console.log(`✅ Updated ${todosToUpdate.length} todo UUIDs`);

    // DiariesのUUIDを更新
    const diariesToUpdate = await db
      .select({ id: schema.diaries.id })
      .from(schema.diaries);

    for (const diary of diariesToUpdate) {
      const newId = randomUUID();
      await db
        .update(schema.diaries)
        .set({ id: newId })
        .where(eq(schema.diaries.id, diary.id));
    }
    console.log(`✅ Updated ${diariesToUpdate.length} diary UUIDs`);

    // 最終的な統計を表示
    const finalTodoCount = await db
      .select({ count: count() })
      .from(schema.todos);

    const completedTodos = await db
      .select({ count: count() })
      .from(schema.todos)
      .where(eq(schema.todos.completed, true));

    const finalDiaryCount = await db
      .select({ count: count() })
      .from(schema.diaries);

    const publishedDiaries = await db
      .select({ count: count() })
      .from(schema.diaries)
      .where(eq(schema.diaries.status, 'published'));

    console.log('📊 Seeding Summary:');
    console.log(`   Test User: ${testUserName} (${testUserEmail})`);
    console.log(`   Total TODOs: ${finalTodoCount[0]?.count || 0}`);
    console.log(
      `   Completed TODOs: ${completedTodos[0]?.count || 0} (${Math.round(((completedTodos[0]?.count || 0) / (finalTodoCount[0]?.count || 1)) * 100)}%)`,
    );
    console.log(`   Total Diaries: ${finalDiaryCount[0]?.count || 0}`);
    console.log(
      `   Published Diaries: ${publishedDiaries[0]?.count || 0} (${Math.round(((publishedDiaries[0]?.count || 0) / (finalDiaryCount[0]?.count || 1)) * 100)}%)`,
    );

    console.log('✅ Database seeded successfully');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await sql.end();
    process.exit(1);
  }
}

main();
