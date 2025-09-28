# プロジェクト概要
- Next.js 15 App Router を軸にした SaaS テンプレート。認証フロー、ダッシュボード、Todo/日記などのベース機能が実装済み。
- プロダクト目標: Better Auth 連携の認証、MinIO/R2 を使うストレージ、Drizzle ORM による Postgres データ層を提供し、追加機能実装の土台を作る。
- 主な技術スタック: TypeScript + React 19、Tailwind CSS v4、Radix UI/shadcn ui、Drizzle ORM、Better Auth、MinIO (dev)/Cloudflare R2 (prod)、Vitest/Playwright、Biome、nuqs、next-safe-action v8。
- 実行フロー: app ディレクトリは RSC ベース。`src/lib` にユースケース・クエリ・ミューテーション・サービスを分離し、`src/lib/actions` の next-safe-action が UI とユースケースを仲介する。
- ストレージ構成: 開発は MinIO、`MINIO_*` 環境変数で設定。本番は R2 を想定。`src/lib/storage` 配下に抽象化がある。
- 監視・トレーシング: Sentry (edge/server) と dev3000 ログ監視。サーバー側ログは `@/lib/utils/logger` 経由で出力する必要がある。
