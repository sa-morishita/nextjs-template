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
   - Drizzleスキーマのプッシュ
   - Git hooksのセットアップ
   - Supabase Localの設定（worktree専用ポート）
   - VSCode workspaceファイルの更新

   !bash .document/scripts/create-worktree.sh [ワークツリー名] [ブランチ名]

6. 作成されたワークツリーに移動
   !cd work/[ワークツリー名]

7. Supabase Localを起動
   !supabase start

8. 開発準備完了の確認
   !echo "✅ ワークツリーの作成と開発環境のセットアップが完了しました"
   !echo "📁 作業ディレクトリ: $(pwd)"
   !echo "🌿 現在のブランチ: $(git branch --show-current)"

## 使用例

```
/git:create-worktree 123
```

これにより：

1. GitHub issue #123の内容を確認
2. 適切な名前（例: issue-123-user-auth）でワークツリーを作成
3. feature/123-user-authブランチを作成
4. 開発環境を自動セットアップ
5. Supabase Localを起動

## 注意事項

- main/master/developブランチから実行する必要があります
- 各ワークツリーは独立したSupabase Local環境を持ちます
- ポート番号は自動的に割り当てられます
- .env.localは自動的にコピーされます
