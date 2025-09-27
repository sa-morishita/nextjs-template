# プロジェクト概要
- Next.js 15.5.4 + React 19 をベースにした日本語向けモダンWebアプリのテンプレート。Better Auth によるメール認証、TODO/Diary 管理、MinIO/Cloudflare R2 連携をサンプル実装。
- サーバーアクションは next-safe-action を利用し、`src/lib/actions → usecases → mutations/queries/services` のレイヤーでドメインロジックを整理。RSC コンポーネントを標準とし、必要部分のみ `use client`。
- DB には PostgreSQL + Drizzle ORM、ローカルは MinIO、CI/CD は GitHub Actions + Vercel。品質は Biome・TypeScript・Vitest・Playwright・Sentry で担保。
- ルーティングは App Router。`RootLayout` (src/app/layout.tsx) が NuqsAdapter/Toaster を内包し、`src/app/(auth)` が認証フロー、`src/app/(protected)/dashboard` がメインUI。UI は Tailwind CSS v4 + shadcn/ui コンポーネント。
- 代表的シンボル: `createTodoAction` (src/lib/actions/todos.ts) が server action、`createTodoUsecase` (src/lib/usecases/todos.ts) がバリデーションと永続化を司る。その他ドメイン毎に usecase/action が対になっている。
- 主要構成: `src/lib` にドメイン層、`src/components` にUI部品、`src/db/schema` に Drizzle スキーマ、`src/test` にテストユーティリティ、`e2e` に Playwright スイート。