# Project Structure

## Root Directory Organization

```
nextjs-template/
├── .claude/               # Claude Code設定
│   └── commands/          # カスタムコマンド定義
├── .document/             # プロジェクトドキュメント
│   ├── architecture/      # アーキテクチャ設計書
│   ├── scripts/           # セットアップスクリプト
│   └── specs/             # 機能仕様書
├── .github/               # GitHub設定
│   └── workflows/         # GitHub Actions CI/CD
├── .kiro/                 # Kiro Spec-Driven Development
│   ├── steering/          # プロジェクトガイドライン
│   └── specs/             # 機能仕様書
├── e2e/                   # E2Eテスト（Playwright）
├── public/                # 静的ファイル
├── src/                   # ソースコード
└── test/                  # テストユーティリティ
```

## Subdirectory Structures

### `src/app/` - Next.js App Router

```
app/
├── (auth)/                # 認証グループルート
│   └── auth/              # 認証ページ
│       ├── _components/   # 認証コンポーネント
│       ├── login/         # ログインページ
│       ├── signup/        # サインアップページ
│       ├── forgot-password/ # パスワード忘れ
│       ├── reset-password/  # パスワードリセット
│       └── verify-email/    # メール認証
├── (protected)/           # 保護されたルート
│   └── dashboard/         # ダッシュボード
│       ├── (home)/        # ホーム（TODO・日記一覧）
│       ├── tasks/         # TODO管理
│       └── diary/         # 日記管理
├── api/                   # APIルート
│   └── auth/[...all]/     # Better Auth APIエンドポイント
├── error.tsx              # エラーバウンダリ
├── layout.tsx             # ルートレイアウト
└── not-found.tsx          # 404ページ
```

### `src/components/` - UIコンポーネント

```
components/
├── auth/                  # 認証関連コンポーネント
│   ├── auth-form-wrapper.tsx
│   └── user-button.tsx
├── dashboard/             # ダッシュボードレイアウト
│   ├── app-sidebar.tsx    # サイドバー
│   └── dashboard-layout.tsx
└── ui/                    # 基本UIコンポーネント
    ├── button.tsx
    ├── form.tsx
    ├── dialog.tsx
    └── ... (shadcn/ui components)
```

### `src/lib/` - コアアプリケーションロジック

```
lib/
├── actions/               # Server Actions (エントリーポイント)
│   ├── auth.ts            # 認証アクション
│   ├── todos.ts           # TODOアクション
│   └── diary.ts           # 日記アクション
├── domain/                # ドメインモデル
│   ├── auth.ts            # 認証ドメイン
│   ├── todos/             # TODOドメイン
│   ├── diary/             # 日記ドメイン
│   └── storage/           # ストレージ設定
├── usecases/              # ビジネスロジック
│   ├── auth.ts
│   ├── todos.ts
│   └── diary.ts
├── mutations/             # データ変更
│   ├── todos.ts
│   └── diaries.ts
├── queries/               # データ取得
│   ├── todos.ts
│   └── diaries.ts
├── services/              # 外部サービス連携
│   ├── auth/              # Better Auth設定
│   ├── email.ts           # メール送信
│   └── image-upload.service.ts
├── schemas/               # Zodバリデーション
│   ├── auth.ts
│   ├── todos.ts
│   └── diary.ts
├── storage/               # ストレージクライアント
│   └── client.ts
└── utils/                 # ユーティリティ
    ├── error-translator.ts
    ├── safe-action.ts
    └── cache-tags.ts
```

### `src/db/` - データベース

```
db/
├── schema/                # Drizzle ORMスキーマ
│   ├── auth.ts            # Better Auth テーブル
│   ├── todos.ts           # TODOテーブル
│   └── diaries.ts         # 日記テーブル
├── client.ts              # データベースクライアント
├── seed.ts                # 開発用シードデータ
└── setup-rls.ts           # 本番用RLS設定
```

### `test/` - テストユーティリティ

```
test/
├── factories/             # テストデータファクトリー
│   ├── todo.factory.ts
│   └── diary.factory.ts
├── helpers/               # テストヘルパー
│   ├── db.ts              # DBセットアップ
│   └── auth.ts            # 認証モック
└── mocks/                 # モック実装
    └── handlers.ts        # MSWハンドラー
```

## Code Organization Patterns

### Container/Presentationalパターン

各機能の`_containers/`ディレクトリに3ファイル構成：

```
_containers/
└── feature-name/
    ├── index.tsx          # エクスポート
    ├── container.tsx      # データフェッチ（Server Component）
    └── presentational.tsx # UI表示（Client Component）
```

### データフローパターン

```
1. actions/ (Server Action定義)
   ↓
2. usecases/ (ビジネスロジック)
   ↓
3. queries/mutations/ (データ操作)
   ↓
4. services/ (外部サービス)
```

## File Naming Conventions

### ディレクトリ命名

- **lowercase-with-dashes**: すべてのディレクトリ名
- **グループ化**: `(group-name)/`でルートグループ
- **プライベート**: `_components/`で内部コンポーネント

### ファイル命名

- **コンポーネント**: `component-name.tsx`
- **テスト**: `*.test.ts(x)`, `*.integration.test.ts`
- **スキーマ**: 単数形 `todo.ts`, `diary.ts`
- **アクション**: 複数形 `todos.ts`, `diaries.ts`

### 関数命名

- **非同期DB操作**: `get*`, `create*`, `update*`, `delete*`
- **純粋関数**: `convert*`, `calculate*`, `validate*`, `map*`
- **Server Actions**: `*Action` (例: `createTodoAction`)

## Import Organization

### インポート順序

1. **外部パッケージ**: React, Next.js, サードパーティ
2. **内部エイリアス**: `@/lib/*`, `@/components/*`
3. **相対インポート**: `./`, `../`
4. **型定義**: `type`, `interface`のインポート

### パスエイリアス

- `@/*` → `./src/*`
- 深いネストを避けるためにエイリアスを活用

## Key Architectural Principles

### 1. Server Components First

- デフォルトでServer Componentを使用
- `use client`は必要最小限に
- データフェッチはServer Componentで実行

### 2. 型安全性の確保

- TypeScript strict mode
- Zodによるランタイム検証
- drizzle-zodによるDB型の自動生成

### 3. エラーハンドリングの統一

- Server Actionsでのエラーは自動キャッチ
- エラーメッセージは日本語に自動翻訳
- ユーザーフレンドリーなエラー表示

### 4. キャッシュ戦略

- タグベースのキャッシュ管理
- 更新時の自動無効化
- 効率的なデータ再取得

### 5. テスタビリティ

- 各レイヤーが独立してテスト可能
- モックしやすい構造
- 統合テストの容易性

### 6. 保守性とスケーラビリティ

- 明確な責務分離
- 機能ごとのモジュール化
- 一貫したコーディング規約