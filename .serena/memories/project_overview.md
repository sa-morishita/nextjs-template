# プロジェクト概要
- Next.js 15 App Router を軸にした SaaS テンプレート。認証フロー、ダッシュボード、Todo/日記などのベース機能が実装済み。
- プロダクト目標: Better Auth 連携の認証、MinIO/R2 を使うストレージ、Drizzle ORM による Postgres データ層を提供し、追加機能実装の土台を作る。
- 主な技術スタック: TypeScript + React 19、Tailwind CSS v4、Radix UI/shadcn ui、Drizzle ORM、Better Auth、MinIO (dev)/Cloudflare R2 (prod)、Vitest/Playwright、Biome、nuqs、next-safe-action v8。
- 実行フロー: app ディレクトリは RSC ベース。`src/lib` にユースケース・クエリ・ミューテーション・サービスを分離し、`src/lib/actions` の next-safe-action が UI とユースケースを仲介する。
- ストレージ構成: 開発は MinIO、`MINIO_*` 環境変数で設定。本番は R2 を想定。`src/lib/storage` 配下に抽象化がある。
- 監視・トレーシング: Sentry (edge/server) と dev3000 ログ監視。サーバー側ログは `@/lib/utils/logger` 経由で出力する必要がある。

## 最近の重要な変更 (2025-10-04更新)
- **サンプルコード分離**: `src/app/(sample)` と `src/lib/sample` にサンプルコードを完全分離。新規実装は `src/app/(protected)` と `src/lib` 直下に配置する。
- **env.mjs → env.ts 移行完了**: `@t3-oss/env-nextjs` による型安全な環境変数管理に移行。`src/env.ts` で全環境変数を定義。
- **Better Auth統合**: シードデータ生成とBetter Auth連携を改善。認証テーブルとアプリケーションテーブルが統合された。
