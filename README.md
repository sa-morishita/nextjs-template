# Next.js モダンWebアプリケーションテンプレート

## 概要

このテンプレートは、Next.js 15.5を基盤とした本格的なWebアプリケーション開発のためのスターターキットです。認証、データベース、テスト、CI/CDなど、プロダクション開発に必要なすべての機能が事前設定されています。

### 主な機能

- 🔐 **認証システム**: Better Authによるメール認証（サインアップ、ログイン、パスワードリセット）
- 📝 **CRUD機能**: TODOとDiary（日記）のサンプル実装
- 🎨 **UIコンポーネント**: Tailwind CSS v4 + shadcn/uiによるモダンなUI
- 🧪 **テスト環境**: Vitest + Playwright による完全テスト環境（単体・統合・E2E）
- 🚀 **CI/CD**: GitHub Actions (コード品質・テスト・セキュリティ監査) + Vercel自動デプロイ

## 技術スタック

- **Framework**: Next.js 15.5 (App Router) + React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase + Drizzle ORM
- **Storage**: Supabase Storage (画像アップロード、ファイル管理)
- **Authentication**: Better Auth
- **Forms**: React Hook Form + Zod + next-safe-action
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **CI/CD**: GitHub Actions (ci.yml, e2e.yml, security.yml) + Vercel

## クイックスタート

### 前提条件

- Node.js v22.15.1以上
- pnpm v9.0.0以上
- Docker Desktop
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### セットアップ

```bash
# 1. 依存関係のインストール
pnpm install

# 2. lefthookのセットアップ
pnpm lefthook install

# 3. Supabase Localの起動
supabase start

# 4. 環境変数の設定
cp .env.local.example .env.local
# .env.localを編集し、supabase statusの情報を設定

# 5. データベースのセットアップ
pnpm db:migrate:dev

# 6. 開発サーバーの起動（dev3000を使用）
pnpm dev  # dev3000による標準起動（デバッグ情報収集機能付き）

# または従来のNext.js開発サーバー
pnpm dev:next  # turbopackを使用した高速開発サーバー
```

#### dev3000について

dev3000は開発中のWebアプリケーションのデバッグ情報を包括的に収集するVercel製のツールです。サーバーログ、ブラウザイベント、コンソールメッセージ、ネットワークリクエスト、自動スクリーンショットを統一されたタイムラインで記録し、AI（Claude）によるデバッグ支援を可能にします。

**ポートオプション**: 異なるポートで起動する場合は `--port` オプションを使用できます：

```bash
pnpm dev --port 3001  # ポート3001で起動
```

### 必須環境変数

```bash
# .env.local（.env.local.exampleを参照）
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
SUPABASE_SERVICE_ROLE_KEY=<supabase statusから取得>
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
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

### 主要コマンド

```bash
# 開発
pnpm dev                    # dev3000による開発サーバー起動（デバッグ機能付き）
pnpm dev:next              # turbopackによる高速開発サーバー
pnpm build                  # プロダクションビルド

# コード品質
pnpm biome check --write .  # コード整形・修正
pnpm typecheck             # 型チェック
pnpm check:all             # すべてのチェック

# データベース
pnpm db:migrate:dev        # データベースのマイグレーション

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
│   ├── supabase/         # Supabaseクライアントとストレージユーティリティ
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
- 🔍 **Lint & Type Check**: Biome + TypeScript
- 🧪 **Unit Tests**: Vitest単体テスト
- 🔗 **Integration Tests**: PGLite統合テスト  
- 🏗️ **Build**: Next.js本番ビルド

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
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY=<Supabaseダッシュボードから取得>
   DATABASE_URL="postgres://postgres.xxxxx:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
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

**本番環境では必ずConnection Pooler URLを使用してください：**

- Supabase Dashboard > Settings > Database > Connection Pooler
- Mode: Transaction
- Port: 6543

## トラブルシューティング

### Supabase Localが起動しない

```bash
# Dockerが起動しているか確認
docker ps

# Supabaseを再起動
supabase stop
supabase start
```

### データベース接続エラー

```bash
# 接続情報を確認
supabase status

# ローカル: ポート54322を使用
# 本番: Connection Pooler (ポート6543)を使用
```

### Better Auth エラー

```bash
# シークレットキーを生成
openssl rand -base64 32
```
