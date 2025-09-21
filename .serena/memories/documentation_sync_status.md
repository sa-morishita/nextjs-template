# 仕様書同期ステータス

## 最終同期日時
2025-09-21T10:44:30.000Z

## 現在の仕様書構造
- overview.md: プロジェクト全体概要
- features/auth.md: 認証機能仕様（プロフィール画像機能を含む）
- features/todos.md: タスク管理機能仕様  
- features/diary.md: 日記機能仕様（統一Storage対応）

## 検証済み対応関係
- src/lib/actions/auth.ts ← → features/auth.md
- src/lib/actions/todos.ts ← → features/todos.md
- src/lib/actions/diary.ts ← → features/diary.md
- src/lib/storage/client.ts ← → 各機能のStorage仕様
- src/lib/services/profile-image.service.ts ← → features/auth.md

## 最新の更新内容（2025-09-21）
### 統一Storageアーキテクチャ
- MinIO（開発環境）とSupabase Storage（本番環境）の自動切り替え
- bucket-config.tsによる統一バケット設定管理
- avatarsバケット、diariesバケットの設定

### プロフィール画像アップロード機能
- 外部URL（Googleアカウント等）からの画像取得・保存
- 古い画像の自動削除機能
- Sentryエラートラッキング統合

### Specify開発フレームワーク
- 仕様書主導開発のためのツール導入
- 統合テスト環境の修正

## 次回同期推奨タイミング
- 新機能追加時
- 既存機能の重要な変更時
- 定期的(週次または月次)