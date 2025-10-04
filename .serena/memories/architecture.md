# ディレクトリ構成と主要モジュール

## アプリケーション構造
- `src/app`: Next.js App Router。`(auth)` と `(protected)` セグメントで認証状態を切替。
  - `(sample)`: **参照専用サンプルコード** - auth flow、dashboard examples
  - `(protected)`: 新規実装はここに配置（認証必須）
  - `api/auth/[...all]/route.ts`: Better Auth のハンドラを委譲

## ビジネスロジック層（src/lib）
- **新規実装**: `src/lib` 直下に配置（`actions/`, `usecases/`, `mutations/`, `queries/`, `domain/`, `schemas/`）
- **サンプルコード**: `src/lib/sample` - 参照専用、変更不可
- **共有インフラ**: `services/`, `storage/`, `utils/` - プロジェクト全体で共有

### データフロー
`actions/` (next-safe-action) → `usecases/` → `mutations/`/`queries/` → データベース

### 主要モジュール
- `src/lib/utils/logger.ts`: プロジェクト標準ロガー。`info`/`warn` は開発専用、本番では `error` のみ出力。
- `src/db`: Drizzle ORM のセットアップ (`client.ts`)、エクスポート (`index.ts`)、シード (`seed.ts`)。
  - `schema`: `todos`, `diaries`, `auth` テーブルなどを定義
- `src/components`: shadcn/ui ベースの UI
  - `ui/`: 共通パーツ
  - `sample/`: サンプルコード（参照専用）
  - 新規コンポーネントは機能別に配置
- `src/hooks`: Zustand ストアやカスタムフック
- `src/test`: テストユーティリティ（Vitest/Testing Library）
- `e2e`: Playwright テスト（`specs/` とグローバルセットアップ）

## 環境変数管理（env.ts）
- `@t3-oss/env-nextjs` による型安全な環境変数管理
- サーバー変数: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `MINIO_*`, `R2_*`
- クライアント変数: `NEXT_PUBLIC_SITE_URL`
- ストレージ切替: `USE_R2` で MinIO/R2 を切り替え
