# コードスタイルと設計指針
- 言語: TypeScript ストリクト。インターフェース優先、enum は使わず const マップで代替。関数型志向でクラス非推奨。
- 命名: DB 操作は `get*/create*/update*/delete*`。純粋関数は `convert*/calculate*/map*/validate*`。ディレクトリはケバブケース。
- コンポーネント: Server Component ファースト。コンテナ/プレゼンテーショナル分離 (`_containers` ディレクトリ、`container.tsx` ↔ `presentational.tsx`)。Tailwind CSS v4 と shadcn/ui + Radix プリミティブ。
- エラーハンドリング: next-safe-action v8 で自動捕捉。アプリケーションロジックでは基本的に try-catch 不使用。サーバーログは `@/lib/utils/logger` の `info`/`warn`/`error` を利用 (本番は `error` のみ出力)。
- ルーティング: Next.js 15 の App Router。`params`/`searchParams` は Promise で提供される点を前提に実装。
- 状態管理: クライアント状態は Zustand、フォームは React Hook Form + Zod。URL 状態は nuqs。
