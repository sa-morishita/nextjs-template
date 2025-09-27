# コードスタイルと設計指針
- 関数型志向でクラス非推奨。必ずTypeScript strict。型は interface 優先、enum の代わりに `const` マップ。
- ディレクトリ名はケバブケース、関数は動詞プレフィックス（`get*`, `create*`, `convert*` など）。純粋関数は副作用を避けユーティリティへ分離。
- App Router は Container/Presentational パターンで `_containers/{index,container,presentational}.tsx` 構成。Server Components 優先で、クライアント処理が必要な場合のみ `use client`。
- サーバーアクション/ユースケースでは try-catch を書かず例外は `handleServerError` に委譲。バリデーションは Zod + `returnValidationErrors` を使用。エラーメッセージは日本語。
- キャッシュは Next.js のタグベース (`todos-user-${userId}` など) で更新時に `revalidateTag`。