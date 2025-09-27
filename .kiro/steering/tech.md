# 技術スタックと開発環境
最終更新: 2025-09-27

## アーキテクチャ概要
- Next.js 15.5.4 (App Router) + React 19 をベースにしたサーバーコンポーネント優先構成。
- ドメイン層は `actions → usecases → mutations/queries/services` の分離で、副作用はユースケースに集約。
- 認証は Better Auth、データ永続化は PostgreSQL + Drizzle ORM、ストレージは MinIO/R2。
- Spec Driven Development（Kiro ワークフロー）により、仕様→設計→タスク→実装を段階管理。

## フロントエンド
- UI: Tailwind CSS v4 + shadcn/ui + Radix UI。
- 状態管理: React Server Components でデータ取得、クライアント側は必要箇所のみ Zustand。
- ルーティング: App Router。`(auth)` と `(protected)` でルートセグメントを分離。
- ユーティリティ: Nuqs (URL state), React Hook Form + Zod + next-safe-action。

## サーバー・バックエンド
- Server Actions でフォーム送信・API 呼び出しを処理。`privateActionClient` を通じてコンテキスト（ユーザー情報等）を注入。
- ビジネスロジックは `src/lib/usecases` 内でバリデーションとトランザクションを担当。
- Drizzle ORM による型安全なクエリ。`src/db/schema` にスキーマ、`src/db/seed.ts` で初期データ投入。

## インフラ・ストレージ
- ローカル: PostgreSQL 17 / MinIO（ポートはセットアップスクリプトがハッシュベースで割当）。
- 本番: Neon (PostgreSQL) + Cloudflare R2。環境変数でエンドポイントや資格情報を指定。
- 監視: Sentry（Next.js エッジ/サーバー両方で設定済み）。

## 開発フローと主要コマンド
- 依存関係: `pnpm install --frozen-lockfile`
- 型生成: `pnpm next typegen`
- 品質: `pnpm biome check --write .`, `pnpm typecheck`, `pnpm check:all`
- テスト: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:storage`, `pnpm test:e2e`
- DB: `pnpm db:migrate:dev`（既存 DB を破壊的に再生成しシード投入）, `pnpm db:studio`
- 開発サーバー: `dev3000`（推奨）、`pnpm dev`
- ストレージ: `/dev/setup-storage` コマンドで MinIO 起動とバケット初期化。

## 環境変数と設定ポイント
- `.env.local` に MinIO／PostgreSQL／Better Auth／Resend 等の値を設定（セットアップスクリプトが初期投入）。
- 代表例:
  - `DATABASE_URL=postgresql://localhost:5432/<project>_main_dev`
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_CONSOLE_PORT`, `MINIO_DATA_DIR`
  - `USE_R2`, `R2_*`（本番ストレージ）、`BETTER_AUTH_SECRET`, `RESEND_API_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- GitHub Actions (`.github/workflows/ci.yml`) は Node 22.15.1 / pnpm 10 で lint・typecheck・unit・integration を実行。

## 推奨ツール・MCP
- Serena MCP: コードベース理解とメモリ管理。
- Brave Search MCP / Context7 MCP / Playwright MCP / dev3000 MCP などがセットアップスクリプトで登録済み。
- Kiro コマンド群 (`/kiro:spec-*`, `/kiro:steering*`) を通じて仕様管理を行う。

## 更新ガイド
- 主要依存（Next.js, React, Better Auth, Drizzle 等）をアップグレードした場合はバージョンを更新。
- 新しいビルド／テストコマンドを追加した際は "開発フローと主要コマンド" セクションに追記。
- 環境変数が増減した場合は代表例を更新し、破壊的変更には注意書きを添える。
