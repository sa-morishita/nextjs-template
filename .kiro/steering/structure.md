# プロジェクト構造
最終更新: 2025-09-27

## ルートディレクトリ構成
- `src/` : アプリケーション本体。App Router、ドメインロジック、テストユーティリティを格納。
- `e2e/` : Playwright による E2E テスト一式（specs, global setup/teardown）。
- `.document/scripts/` : 開発環境セットアップなどの補助スクリプト。
- `.claude/commands/` : Claude Code コマンド定義（kiro ワークフロー含む）。
- `.github/workflows/` : CI/CD 定義。`ci.yml`, `e2e.yml`, `security.yml` 等。
- `drizzle/` : Drizzle によるマイグレーション出力。
- `dev-minio-*` : MinIO ローカルデータ（自動生成、Git 管理外）。

## `src/` 配下の詳細
- `app/`
  - `(auth)/auth/...` : サインアップ・ログイン・メール検証・パスワードリセットの各ページとフォーム。
  - `(protected)/dashboard/...` : 認証後のダッシュボード、TODO・Diary の一覧/編集。`_containers` で Container/Presentational を分離。
  - `layout.tsx` : `RootLayout`。NuqsAdapter と Toaster を組み込み、lang="ja" を設定。
  - `error.tsx`, `not-found.tsx`, `global-error.tsx` : エラーハンドリング用コンポーネント。
- `lib/`
  - `actions/` : next-safe-action で定義した Server Actions（例: `createTodoAction`）。
  - `usecases/` : ビジネスロジック層。入力バリデーションや重複チェックを担当。
  - `mutations/`, `queries/`, `services/`, `storage/` : データアクセスや外部サービス連携を分担。
  - `schemas/`, `constants/`, `utils/`, `types/` : Zod スキーマ、定数、ユーティリティ。
- `db/`
  - `schema/` : Drizzle のテーブル定義 (`auth.ts`, `todos.ts`, `diaries.ts`)。
  - `seed.ts` : 開発用初期データ投入。
- `components/` : 再利用 UI コンポーネント（shadcn/ui パターン）。
- `hooks/` : カスタムフック。
- `test/` : Vitest 用テスト支援。factories/helpers/mocks、および `setup.ts` 等。

## テスト構成
- ユニット: `src/app/**/__tests__`, `src/lib/usecases/__tests__` に Vitest ファイル。
- 統合: `src/lib/usecases/__tests__/*.integration.test.ts`。
- ストレージ: `vitest.storage.config.mts` と `src/test/storage-setup.ts` 等で設定。
- E2E: `e2e/specs/*.spec.ts`（Playwright）。

## 命名規則とパターン
- ディレクトリはケバブケース、ファイルは用途に応じてケバブまたはキャメル（例: `task-form.tsx`）。
- Container/Presentational パターン: `_containers/{index,container,presentational}.tsx` をワンセットで配置。
- Server Action は `*Action`、ユースケースは `*Usecase`。ドメイン関数は `create*`, `get*`, `update*`, `delete*` などの動詞プレフィックス。
- Zod スキーマは `*Schema`、キャッシュタグは `CACHE_TAGS.*`。

## 補足
- `.kiro/specs/` は機能ごとの仕様ディレクトリ。必要に応じて `/kiro:spec-init` で生成。
- Steering 更新後は `/kiro:spec-status` で仕様との整合を確認し、乖離があれば該当 spec を更新する。
- 新しいモジュールやレイヤーを追加した際は本ファイルに反映し、更新日を追記すること。
