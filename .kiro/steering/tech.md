# Technology Stack

## Architecture

### システム構成

- **フロントエンド**: Next.js 15.5 App Router (React 19)
- **バックエンド**: Next.js API Routes + Server Actions
- **データベース**: PostgreSQL + Drizzle ORM
- **ストレージ**: MinIO (開発) / Supabase Storage (本番)
- **認証**: Better Auth
- **デプロイ**: Vercel

### アーキテクチャパターン

- **Server Components First**: React Server Componentsを優先使用
- **Container/Presentational**: データフェッチとUIを分離
- **Domain-Driven Design**: ドメインモデルによるビジネスロジックの整理
- **Layered Architecture**: actions → usecases → mutations/queries → services

## Frontend

- **Framework**: Next.js 15.5 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui パターン
- **Form Handling**: React Hook Form + Zod
- **State Management**: Zustand (クライアントサイド状態)
- **URL State**: nuqs (型安全なURL状態管理)
- **Fonts**: Geist Sans/Mono (最適化済み)

## Backend

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js v22.15.1+
- **Framework**: Next.js Server Actions + API Routes
- **ORM**: Drizzle ORM
- **Validation**: Zod スキーマ
- **Server Actions**: next-safe-action v8
- **Email**: Resend + React Email
- **Error Handling**: 統一エラー変換システム

## Development Environment

### 必須ツール

- **Package Manager**: pnpm v10.0.0+
- **Database**: PostgreSQL 16+ (Homebrew推奨)
- **Storage**: MinIO + MinIO Client (mc)
- **Code Editor**: Claude Code (推奨)
- **Process Manager**: dev3000 (デバッグ機能付き開発サーバー)

### 開発ツール

- **Code Quality**: Biome (フォーマット/リント)
- **Type Checking**: TypeScript
- **Git Hooks**: Lefthook
- **Database GUI**: Drizzle Studio
- **Testing**: Vitest + Playwright
- **Error Monitoring**: Sentry

## Common Commands

```bash
# 開発
dev3000                    # デバッグ情報付き開発サーバー
pnpm dev                   # turbopack高速開発サーバー
pnpm build                 # プロダクションビルド

# コード品質
pnpm check                 # Biomeチェック（自動修正）
pnpm typecheck             # TypeScript型チェック
pnpm check:all             # すべてのチェック実行

# データベース
pnpm db:migrate:dev        # 開発環境マイグレーション（シード含む）
pnpm db:migrate:prod       # 本番環境マイグレーション
pnpm db:studio             # Drizzle Studio起動

# テスト
pnpm test:unit             # ユニットテスト
pnpm test:integration      # 統合テスト
pnpm test:storage          # ストレージテスト  
pnpm test:e2e              # E2Eテスト
pnpm test:all              # 全テスト実行

# ストレージ（開発）
/dev/setup-storage         # MinIOセットアップ（Claude Code）
```

## Environment Variables

### 必須環境変数

```bash
# サイトURL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"  # 開発環境

# データベース
DATABASE_URL="postgresql://localhost:5432/[project]_main_dev"
DRIZZLE_STUDIO_PORT=[dynamic]  # プロジェクト固有

# ストレージ（開発）
NEXT_PUBLIC_SUPABASE_URL="http://localhost:[port]"  # MinIO URL
SUPABASE_SERVICE_ROLE_KEY="minioadmin"
DEV_MINIO_PORT=[dynamic]         # プロジェクト固有
DEV_MINIO_CONSOLE_PORT=[dynamic] # プロジェクト固有
DEV_MINIO_DATA_DIR="./dev-minio-[uuid]"

# 認証
BETTER_AUTH_SECRET=[32バイトランダム文字列]

# メール送信
RESEND_API_KEY=[Resend APIキー]

# ソーシャルログイン（オプション）
LINE_LOGIN_CHANNEL_ID=[LINE Channel ID]
LINE_LOGIN_CHANNEL_SECRET=[LINE Channel Secret]
```

### 本番環境変数

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
SUPABASE_SERVICE_ROLE_KEY=[Supabaseサービスロールキー]

# データベース（Connection Pooler使用）
DATABASE_URL="postgres://[user]:[pass]@[host]:6543/postgres"

# エラー監視
SENTRY_AUTH_TOKEN=[Sentryトークン]
NEXT_PUBLIC_SENTRY_DSN=[Sentry DSN]
```

## Port Configuration

### 開発環境ポート

- **Next.js**: 3000 (デフォルト)
- **MinIO API**: 動的割り当て (9000-9999)
- **MinIO Console**: 動的割り当て (9100-9199)
- **Drizzle Studio**: 動的割り当て (4983-5999)
- **dev3000 MCP**: 動的割り当て (3684+)

### ポート競合回避

- セットアップスクリプトが自動的に利用可能なポートを検出
- `.env.local`にプロジェクト固有のポート設定を保存
- ワークツリーでの並行開発をサポート