# タスク完了チェックリスト
- 影響範囲の `pnpm biome check --write .` と `pnpm typecheck` を実行しエラー解消。
- 変更内容に応じたテスト (`pnpm test:unit` など) を選択実行。E2E/統合テストは必要時のみ。
- DB スキーマ変更がある場合はユーザーに確認してから `pnpm db:migrate:dev` を実行。
- UI/UX 変更の場合はユーザーへブラウザ確認を依頼 (自分で `pnpm dev` を起動しない)。
- ログ出力・監視フロー (Sentry/`@/lib/utils/logger`) が要件を満たすか再確認。
- 変更ファイルをレビューし、命名規約・構造ガイドライン (`src/lib` のレイヤリング等) に沿っているかチェック。
