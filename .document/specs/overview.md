# プロジェクト仕様書概要

**最終更新日**: 2025-09-13T12:00:00.000Z

## プロジェクト概要

Next.js 15 + TypeScript + Supabaseを基盤としたWebアプリケーション。認証機能、タスク管理、日記機能を提供するダッシュボードアプリケーション。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript
- **スタイリング**: Tailwind CSS v4, Radix UI, shadcn/ui
- **データベース**: Supabase + Drizzle ORM
- **認証**: Better Auth
- **フォーム**: React Hook Form + Zod + next-safe-action
- **状態管理**: Zustand
- **品質管理**: Biome, Lefthook
- **テスト**: Vitest + React Testing Library

## アーキテクチャパターン

- **ドメイン駆動設計**: actions → usecases → mutations/queries/services
- **Container/Presentational**: サーバーコンポーネント中心の設計
- **キャッシング戦略**: Next.js Cache Tags による効率的な無効化

## 機能一覧

### 1. [認証機能](./features/auth.md)
- ユーザー登録・ログイン
- メール認証
- パスワードリセット
- セッション管理

### 2. [タスク管理機能](./features/todos.md)
- タスクの作成・編集・削除
- 完了状態の切り替え
- ユーザー別タスク管理

### 3. [日記機能](./features/diary.md)
- 日記エントリの作成
- 画像アップロード対応
- プリサインドURL生成

## ルーティング構造

```
/
├── (auth)/auth/           # 認証関連ページ
│   ├── login/            # ログイン
│   ├── signup/           # サインアップ
│   ├── forgot-password/  # パスワード忘れ
│   ├── reset-password/   # パスワードリセット
│   └── verify-email/     # メール認証
└── (protected)/dashboard/ # 保護されたダッシュボード
    ├── (home)/           # ホーム画面
    ├── tasks/            # タスク管理
    └── diary/            # 日記機能
```

## 開発ガイドライン

- **コーディング**: 関数型/宣言的プログラミング
- **命名規則**: ディレクトリはkebab-case、関数は動詞から開始
- **エラーハンドリング**: next-safe-actionによる自動エラーキャッチ
- **テスト戦略**: ユニット/統合テストの分離、Mockは必要最小限

## 最近の更新

### 2025-09-13
- 仕様書管理システムの初期化完了
- 主要機能（認証、タスク管理、日記）の仕様書作成
- CI/テスト環境の安定化（Biome設定最適化）

## 参考資料

- [プロジェクト設定](../../CLAUDE.md)
- [開発コマンド](../../package.json)
- [型定義](../../src/lib/schemas/)