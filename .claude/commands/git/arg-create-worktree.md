GitHub issueからワークツリーを作成してセットアップ

---

allowed-tools: ["Bash", "Read"]
description: "issue番号からワークツリーとブランチを作成し開発準備"

---

# create-worktree

GitHub issueの番号を指定して、適切な名前のワークツリーとブランチを作成し、開発環境をセットアップします。

## Instructions

1. ユーザーから受け取ったissue番号を確認
   Issue番号: $ARGUMENTS

2. GitHub CLIでissueの内容を確認
   !gh issue view $ARGUMENTS

3. issueの内容から適切な名前を決定
   - issue番号とタイトルから、ワークツリー名とブランチ名を生成
   - 例: issue #123 "ユーザー認証機能の追加" の場合
     - ワークツリー名: `issue-123-user-auth`
     - ブランチ名: `feature/123-user-auth`

4. create-worktree.shスクリプトの主要な処理内容を確認
   !cat .document/scripts/create-worktree.sh | grep -E "^#|使用方法|命名規則" | head -20

5. 決定した名前でワークツリーを作成
   スクリプトは以下の処理を自動実行：
   - worktreeとブランチの作成
   - 依存関係のインストール（pnpm install）
   - 環境設定ファイル（.env.local）のコピー
   - ワークツリー専用PostgreSQLデータベースの作成
   - ワークツリー専用MinIOストレージディレクトリの作成
   - データベースマイグレーションの実行
   - Git hooksのセットアップ
   - MinIOストレージサーバーの自動起動
   - VSCode workspaceファイルの更新

   !bash .document/scripts/create-worktree.sh [ワークツリー名] [ブランチ名]

6. 作成されたワークツリーに移動
   !cd work/[ワークツリー名]

7. 開発準備完了の確認と環境情報の表示
   !echo "✅ ワークツリーの作成と開発環境のセットアップが完了しました"
   !echo "📁 作業ディレクトリ: $(pwd)"
   !echo "🌿 現在のブランチ: $(git branch --show-current)"
   !echo ""
   
   # 環境変数から実際のポート番号を取得して表示
   !source .env.local 2>/dev/null && echo "🚀 MinIOストレージサーバーが自動的に起動されました"
   !source .env.local 2>/dev/null && echo "   📡 API: http://localhost:$MINIO_PORT"
   !source .env.local 2>/dev/null && echo "   🌐 Console: http://localhost:$MINIO_CONSOLE_PORT (minioadmin/minioadmin)"
   !source .env.local 2>/dev/null && echo "   📦 バケット管理はConsoleから行えます"
   !echo ""
   !source .env.local 2>/dev/null && echo "🎨 Drizzle Studio (データベース管理)"
   !source .env.local 2>/dev/null && echo "   🌐 起動: pnpm db:studio"
   !source .env.local 2>/dev/null && echo "   📡 URL: http://localhost:$DRIZZLE_STUDIO_PORT"

## 使用例

```
/git:arg-create-worktree 123
```

これにより：

1. GitHub issue #123の内容を確認
2. 適切な名前（例: issue-123-user-auth）でワークツリーを作成
3. feature/123-user-authブランチを作成
4. 開発環境を自動セットアップ

## 注意事項

- main/master/developブランチから実行する必要があります
- 各ワークツリーは独立したPostgreSQLデータベースを持ちます
- 各ワークツリーは独立したMinIOストレージディレクトリを持ちます
- .env.localは自動的にコピーされ、ワークツリー用に設定が更新されます
- MinIOストレージサーバーは自動的に起動されます（各ワークツリーで同じポートを使用）
- ワークツリー削除時にMinIOプロセスも自動的に停止されます
