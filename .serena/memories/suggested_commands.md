# よく使うコマンド
- 初期化: `/project/setup-environment` で環境変数生成・DB作成・MCP追加。ストレージは `/dev/setup-storage`。
- 依存関係: `pnpm install --frozen-lockfile`。
- 開発サーバー: `dev3000` (MCP連携・ポート指定可)、通常の Next.js は `pnpm dev`。
- 品質チェック: `pnpm biome check --write .` または `pnpm check`、型検査は `pnpm typecheck`、両方まとめて `pnpm check:all`。
- テスト: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:storage`, `pnpm test:e2e`, 一括は `pnpm test:all`。
- DB操作: `pnpm db:migrate:dev` (既存DB破壊→再生成→マイグレーション→シード)、`pnpm db:studio` で Drizzle Studio。
- CIと同期: `pnpm next typegen` で型生成を手動更新可能。