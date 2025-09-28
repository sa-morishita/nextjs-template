# ディレクトリ構成と主要モジュール
- `src/app`: Next.js App Router。`(auth)` と `(protected)` セグメントで認証状態を切替。`dashboard` セグメントは Todo/Diary 用 UI。`api/auth/[...all]/route.ts` で Better Auth のハンドラを委譲。
- `src/lib`: ドメインロジック。本層は `actions` (next-safe-action)、`usecases`、`mutations`、`queries`、`services`、`domain`、`utils`、`storage` に分割。例えば `actions/todos.ts` の `createTodoAction` が `usecases/todos.ts` の `createTodoUsecase` を呼び出し、`mutations/todos.ts` や `queries/todos.ts` がデータアクセスを担当。
- `src/lib/utils/logger.ts`: プロジェクト標準ロガー。`info`/`warn` は開発専用、本番では `error` のみ出力。
- `src/db`: Drizzle ORM のセットアップ (`client.ts`)、エクスポート (`index.ts`)、シード (`seed.ts`)。`schema` 配下で `todos`, `diaries`, `auth` テーブルなどを定義 (例: `todos` テーブルは `id`, `userId`, `title`, `completed`, `createdAt`, `updatedAt` を持つ)。
- `src/components`: shadcn/ui ベースの UI とドメイン別コンポーネント。`ui/` に共通パーツ、`auth/` と `dashboard/` に機能別 UI。
- `src/hooks`: Zustand ストアやカスタムフックを配置。
- `src/test`: テストユーティリティ。Vitest/Testing Library サポート。
- `e2e`: Playwright テスト。`specs` とグローバルセットアップ/ティアダウン。
