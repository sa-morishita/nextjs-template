# 作業完了チェックリスト
1. 変更意図を README/AGENTS のルールと突き合わせ、Kiro仕様（spec → design → tasks）に抵触しないか確認。
2. ローカルで `pnpm biome check --write .` または `pnpm check`、`pnpm typecheck` を実行。必要に応じて関連テスト (`pnpm test:*`) を選択的に回す。
3. サーバーアクションやユースケースを触った場合はキャッシュタグ更新や翻訳メッセージを見直す。
4. UI変更はコンテナ/プレゼンテーション分離と Tailwind v4 スタイル遵守を確認。クライアント化が必要か再検討。
5. 仕様ドキュメント (.kiro/specs) を更新している場合は `/kiro:spec-status` で整合をチェック。レビューコメントやデプロイ手順を添えてPRへ。