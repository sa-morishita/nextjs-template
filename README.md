# Next.js モダンWebアプリケーションテンプレート

## 概要

このテンプレートは、Next.js 15.5.4を基盤とした本格的なWebアプリケーション開発のためのスターターキットです。認証、データベース、テスト、CI/CDなど、プロダクション開発に必要なすべての機能が事前設定されています。

### 主な機能

- 🔐 **認証システム**: Better Authによるメール認証（サインアップ、ログイン、パスワードリセット）
- 📝 **CRUD機能**: TODOとDiary（日記）のサンプル実装
- 🎨 **UIコンポーネント**: Tailwind CSS v4 + shadcn/uiによるモダンなUI
- 🧪 **テスト環境**: Vitest + Playwright による完全テスト環境（単体・統合・E2E）
- 🚀 **CI/CD**: GitHub Actions (コード品質・テスト・セキュリティ監査) + Vercel自動デプロイ

## 技術スタック

- **Framework**: Next.js 15.5.4 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: PostgreSQL (ローカル) / Neon (本番) + Drizzle ORM
- **Storage**: MinIO (ローカル) / Cloudflare R2 (本番)
- **Authentication**: Better Auth
- **Forms**: React Hook Form + Zod + next-safe-action
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **CI/CD**: GitHub Actions (ci.yml, e2e.yml, security.yml) + Vercel

## クイックスタート

### 前提条件

- Node.js v22.15.1以上
- pnpm v10.0.0以上
- PostgreSQL 17以上
- MinIO (ローカルストレージ)
- MinIO Client (mc)
- [Claude Code](https://code.claude.ai/) (推奨)

### セットアップ

```bash
# 1. 開発環境のセットアップ（初回のみ）
# Claude Codeでカスタムコマンドを実行
/project/setup-environment

# このコマンドは以下を自動実行：
# - 環境変数ファイル(.env.local)の作成
# - PostgreSQLデータベースの作成
# - MinIOストレージの設定
# - Claude Code MCPの設定
# - Drizzle Studioポート設定

# 2. 依存関係のインストール
pnpm install

# 3. Git hooks（Lefthook）のセットアップ
pnpm lefthook install

# 4. データベースの再生成とマイグレーション（破壊的）
pnpm db:migrate:dev
```

### ストレージの起動（必要な時のみ）

```bash
# Claude Codeでカスタムコマンドを実行
/dev/setup-storage    # 起動と app バケット初期化まで自動
```

### 開発サーバーの起動

```bash
# 開発サーバーの起動
dev3000  # デバッグ情報収集機能付き開発サーバー

# ワークツリーで異なるポートで起動する場合（ポート競合回避）
dev3000 --port 3001 --mcp-port 3685

# または従来のNext.js開発サーバー
pnpm dev  # turbopackを使用した高速開発サーバー
```

### 必須環境変数

```bash
# .env.local（setup-development-environment.shで自動生成）
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# ローカルストレージ設定（MinIO）
MINIO_ENDPOINT="http://localhost:xxxxx"  # MinIO APIポート
MINIO_BUCKET="app"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_PUBLIC_BASE_URL="http://localhost:xxxxx/app"
MINIO_PORT=xxxxx             # MinIO APIポート (上記ENDPOINTと揃える)
MINIO_CONSOLE_PORT=xxxxx     # MinIO Consoleポート
MINIO_DATA_DIR="./dev-minio-xxxxxxxx"
USE_R2="false"

# データベース設定（PostgreSQL）
DATABASE_URL="postgresql://localhost:5432/プロジェクト名_main_dev"
DRIZZLE_STUDIO_PORT=xxxxx    # プロジェクト固有のポート

# 認証・外部サービス
BETTER_AUTH_SECRET=<openssl rand -base64 32 で生成>
RESEND_API_KEY=<Resendダッシュボードから取得>
LINE_LOGIN_CHANNEL_ID=<LINE Developersから取得>
LINE_LOGIN_CHANNEL_SECRET=<LINE Developersから取得>
```

## 開発ガイド

### 基本的な開発フロー

1. **機能開発**: `src/lib/`配下でロジックを実装
2. **UI作成**: `src/components/`でコンポーネントを作成
3. **ルーティング**: `src/app/`でページを配置
4. **テスト**: `*.test.ts(x)`でテストを記述

### ロギング方針

- すべての診断ログは `src/lib/utils/logger.ts` に定義された `logger` を経由して出力します。
- `logger.info` / `logger.warn` は開発環境でのみ標準出力され、本番ビルドでは自動的に抑制されます。
- `logger.error` は環境に関わらず出力されるため、サーバーサイドの例外や致命的な状況に使用してください。

### 主要コマンド

```bash
# 開発
dev3000                     # dev3000による開発サーバー起動（デバッグ機能付き）
pnpm dev                    # turbopackによる高速開発サーバー
pnpm build                  # プロダクションビルド

# コード品質
pnpm check                 # コード整形・修正
pnpm typecheck             # 型チェック
pnpm check:all             # すべてのチェック

# データベース
pnpm db:migrate:dev        # データベースを再生成してマイグレーション＆シード (破壊的)
pnpm db:studio             # Drizzle Studio起動（DB管理UI）

# テスト
pnpm test:unit             # ユニットテスト
pnpm test:integration      # 統合テスト
pnpm test:storage          # ストレージテスト
pnpm test:e2e              # E2Eテスト (Playwright)
pnpm test:all              # 全テスト実行
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ルート (login, signup, password reset)
│   ├── (protected)/       # 保護されたルート (要認証)
│   └── api/auth/[...all]/ # Better Auth API routes
├── components/            # 再利用可能なUIコンポーネント
│   ├── auth/             # 認証関連コンポーネント
│   ├── dashboard/        # ダッシュボードレイアウト
│   └── ui/               # 基本UIコンポーネント (shadcn/ui)
├── db/                    # データベース設定
│   └── schema/           # Drizzle ORMスキーマ (auth, todos, diaries)
├── lib/                   # コアアプリケーションロジック
│   ├── actions/          # Server Actions (usecasesをインポート)
│   ├── domain/           # ドメインモデルとビジネスルール
│   │   ├── auth/        # 認証ドメイン
│   │   ├── diary/       # 日記ドメイン
│   │   └── todos/       # TODOドメイン
│   ├── mutations/        # データ変更ロジック
│   ├── queries/          # データ取得ロジック
│   ├── schemas/          # Zodバリデーションスキーマ
│   ├── services/         # ビジネスサービス
│   │   └── auth/        # Better Auth設定と認証サービス
│   ├── usecases/         # アプリケーションビジネスロジック
│   └── utils/            # ユーティリティ関数
└── test/                  # テストユーティリティ
    ├── factories/        # テストデータファクトリー
    ├── helpers/          # テストセットアップヘルパー
    └── mocks/            # モック実装

e2e/                       # E2Eテスト (Playwright)
├── specs/                # テストケース
├── global-setup.ts       # グローバルセットアップ
└── global-teardown.ts    # グローバルクリーンアップ
```

## CI/CD & デプロイ

### GitHub Actions ワークフロー

プロジェクトには以下のワークフローが設定されています：

#### **`ci.yml`** - メインCI

- 🔄 **Next.js Typegen**: `pnpm next typegen` で型を同期
- 🔍 **Lint & Type Check**: Biome + TypeScript
- 🧪 **Unit Tests**: Vitest単体テスト（カバレッジ収集 & Codecov 送信）
- 🔗 **Integration Tests**: PGLite統合テスト（ダミー環境変数で実行）

#### **`e2e.yml`** - E2Eテスト

- 🎭 **Playwright E2E**: ブラウザ自動化テスト
- 📱 **Multi-browser**: Chromium対応
- 📊 **Test Artifacts**: 失敗時のスクリーンショット・動画保存

#### **`security.yml`** - セキュリティ監査

- 🔒 **Dependency Audit**: 依存関係の脆弱性チェック
- ⏰ **Scheduled**: 毎週月曜日自動実行

#### **その他**

- `pr-review.yml`: PR固有処理
- `deploy-database.yml`: データベースマイグレーション

### デプロイ

### Vercelへのデプロイ

1. **Vercelプロジェクトの作成**
   - [Vercel](https://vercel.com)でGitHubリポジトリを接続
   - Framework Preset: Next.jsを選択

2. **環境変数の設定**

   ```bash
   NEXT_PUBLIC_SITE_URL="https://your-domain.com"
   # ストレージ設定（Cloudflare R2 使用）
   USE_R2="true"
   R2_ACCOUNT_ID=<Cloudflare ダッシュボードで確認>
   R2_ACCESS_KEY_ID=<Cloudflare R2 API Token Access Key>
   R2_SECRET_ACCESS_KEY=<Cloudflare R2 API Token Secret>
   R2_BUCKET=<利用するR2バケット名>
   R2_PUBLIC_BASE_URL=<画像配信に利用するカスタムドメインまたは公開URL>
   # データベース設定（Neon pooler endpoint使用）
   DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
   BETTER_AUTH_SECRET=<本番用に新しく生成>
   RESEND_API_KEY=<本番用APIキー>
   LINE_LOGIN_CHANNEL_ID=<LINE Developersから取得>
   LINE_LOGIN_CHANNEL_SECRET=<LINE Developersから取得>
   SENTRY_AUTH_TOKEN=<Sentryダッシュボードから取得>
   NEXT_PUBLIC_SENTRY_DSN=<SentryのDSN>
   ```

3. **自動デプロイ**
   - `main`ブランチへのプッシュで自動デプロイ
   - PRごとにプレビュー環境を自動作成

### データベース設定

**本番環境では必ずNeonのpooled connectionを使用してください：**

- Neon Dashboard > Connection Details
- Pooled connectionにチェック
- エンドポイントに`-pooler`が付いていることを確認
- SSL Mode: require

## トラブルシューティング

### PostgreSQLが起動しない

```bash
# PostgreSQLの状態確認
brew services list | grep postgresql

# PostgreSQLを起動
brew services start postgresql@17
```

### MinIOが起動しない

```bash
# ポートの使用状況を確認
lsof -i :9024

# MinIOプロセスを確認
ps aux | grep minio

# MinIOを再起動
source .env.local
minio server "$MINIO_DATA_DIR" --address ":$MINIO_PORT" --console-address ":$MINIO_CONSOLE_PORT"
```

### データベース接続エラー

```bash
# データベースの存在確認
psql -U $USER -l

# ローカル: PostgreSQL ポート5432を使用
# 本番: Neon pooled connection (-pooler付きエンドポイント)を使用
```

### Better Auth エラー

```bash
# シークレットキーを生成
openssl rand -base64 32
```
