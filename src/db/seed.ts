#!/usr/bin/env tsx
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import dotenv from 'dotenv';
import { and, count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { reset, seed } from 'drizzle-seed';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// .env.localを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// 本番環境での実行を防ぐ
if (
  process.env.NODE_ENV === 'production' ||
  process.env.DATABASE_URL?.includes('supabase.co') ||
  process.env.DATABASE_URL?.includes('neon.tech')
) {
  console.log('❌ Cannot seed production database');
  process.exit(0);
}

// データベース接続
const connectionString = process.env.DATABASE_URL || '';
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function main() {
  console.log('🌱 Seeding database with sample data...');

  try {
    // drizzle-seedのreset機能を使用してデータベースをリセット
    console.log('🗑️  Resetting database using drizzle-seed reset...');
    await reset(db, schema);
    console.log('✅ Database reset completed');

    // サンプルユーザーを作成
    console.log('👤 Creating sample users...');
    const sampleUsers = [
      {
        id: 'user-1',
        email: 'john@example.com',
        emailVerified: true,
        name: 'John Doe',
        image: null,
        lineUserId: null,
        lineUserName: null,
        lastLoginAt: new Date('2025-01-01T10:00:00Z'),
      },
      {
        id: 'user-2',
        email: 'jane@example.com',
        emailVerified: true,
        name: 'Jane Smith',
        image: null,
        lineUserId: null,
        lineUserName: null,
        lastLoginAt: new Date('2025-01-10T15:30:00Z'),
      },
      {
        id: 'user-3',
        email: 'bob@example.com',
        emailVerified: true,
        name: 'Bob Johnson',
        image: null,
        lineUserId: null,
        lineUserName: null,
        lastLoginAt: null,
      },
      {
        id: 'user-4',
        email: `no-email-U123456789@line.local`,
        emailVerified: true,
        name: 'LINE User',
        image: 'https://example.com/line-profile.jpg',
        lineUserId: 'U123456789',
        lineUserName: 'LINEユーザー',
        lastLoginAt: new Date('2025-01-15T09:00:00Z'),
      },
    ];

    await db.insert(schema.user).values(sampleUsers);
    console.log(`✅ Created ${sampleUsers.length} sample users`);

    // drizzle-seedでTODOサンプルデータを生成
    console.log('📝 Generating sample todos with drizzle-seed...');

    // seedに渡すスキーマを定義
    const seedSchema = {
      todos: schema.todos,
    };

    // drizzle-seedを実行してTODOデータを生成
    await seed(db, seedSchema, { count: 20, seed: 12345 }).refine((funcs) => ({
      todos: {
        columns: {
          id: funcs.uuid(),
          userId: funcs.valuesFromArray({
            values: sampleUsers.map((user) => user.id),
          }),
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
    }));

    console.log('✅ Sample todos created successfully with drizzle-seed');

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

    // 最終的な統計を表示
    const finalTodoCount = await db
      .select({ count: count() })
      .from(schema.todos);

    const userTodoStats = await Promise.all(
      sampleUsers.map(async (user) => {
        const userTodos = await db
          .select({ count: count() })
          .from(schema.todos)
          .where(eq(schema.todos.userId, user.id));

        const completedTodos = await db
          .select({ count: count() })
          .from(schema.todos)
          .where(
            and(
              eq(schema.todos.userId, user.id),
              eq(schema.todos.completed, true),
            ),
          );

        return {
          user: user.name,
          totalTodos: userTodos[0]?.count || 0,
          completedTodos: completedTodos[0]?.count || 0,
        };
      }),
    );

    console.log('📊 Seeding Summary:');
    console.log(`   Total Users: ${sampleUsers.length}`);
    console.log(`   Total TODOs: ${finalTodoCount[0]?.count || 0}`);
    console.log('   User TODO Statistics:');

    for (const stat of userTodoStats) {
      console.log(
        `     ${stat.user}: ${stat.totalTodos} todos (${stat.completedTodos} completed)`,
      );
    }

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
