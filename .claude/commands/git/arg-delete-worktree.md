issue番号に対応するワークツリーとブランチを削除

---
allowed-tools: ["Bash", "Read"]
description: "issue番号を指定してワークツリーとブランチを削除"
---

# delete-worktree

issue番号に紐づいたワークツリーとブランチを安全に削除します。

## Instructions

1. スクリプトファイルの内容を確認
   !cat .document/scripts/delete-worktree.sh | head -30

2. 現在のワークツリーとブランチの状況を確認
   !echo "=== 現在のワークツリー一覧 ==="
   !git worktree list
   !echo ""
   !echo "=== 現在のブランチ一覧 ==="
   !git branch -a | grep -E "^\s*(feature/|hotfix/)" | head -20

3. ユーザーから受け取ったissue番号を使用してワークツリーを削除
   削除対象issue番号: $ARGUMENTS
   
   まず、issue番号に対応するワークツリー名を特定：
   !echo "=== Issue番号 $ARGUMENTS に対応するワークツリーを検索 ==="
   !git worktree list | grep -E "work/.*$ARGUMENTS" || echo "見つかりません"
   !echo ""
   !echo "=== 'issue-$ARGUMENTS' で始まるワークツリーを検索 ==="
   !git worktree list | grep -E "work/issue-$ARGUMENTS" || echo "見つかりません"

   注意: スクリプトは以下の処理を行います：
   - ワークツリーの存在確認
   - MinIOプロセスの確認
   - ワークツリーの削除
   - PostgreSQLデータベースの削除
   - MinIOストレージディレクトリの削除
   - 関連ブランチの削除
   - VSCode workspaceファイルの更新

4. スクリプトを実行
   # issue番号からワークツリー名を特定して実行
   !WORKTREE_NAME=$(git worktree list | grep -E "work/.*$ARGUMENTS" | awk '{print $1}' | xargs basename | head -1)
   !if [ -n "$WORKTREE_NAME" ]; then echo "削除対象: $WORKTREE_NAME" && bash .document/scripts/delete-worktree.sh "$WORKTREE_NAME"; else echo "Issue番号 $ARGUMENTS に対応するワークツリーが見つかりません"; fi

5. 削除後の状態を確認
   !echo "=== 削除後のワークツリー一覧 ==="
   !git worktree list
   !echo ""
   !echo "=== 削除後のブランチ一覧 ==="
   !git branch -a | grep -E "^\s*(feature/|hotfix/)" | head -20

## 使用例

```
/git:arg-delete-worktree 123
```

これにより、issue番号123に関連するワークツリー（例: work/issue-123-login、work/123-login など）とブランチ（例: feature/123-login）が削除されます。

スクリプトは以下のパターンでワークツリーを検索します：
- `work/*123*` - issue番号を含むワークツリー
- `work/issue-123*` - "issue-"プレフィックス付きのワークツリー

## 注意事項

- スクリプトは削除前に確認プロンプトを表示します（"yes"の入力が必要）
- 現在作業中のワークツリーからは削除できません
- PostgreSQLデータベースとMinIOストレージも自動的に削除されます
- VSCode workspaceファイルも自動的に更新されます

## トラブルシューティング

### ワークツリーが見つからない場合
- issue番号が正しいか確認
- `git worktree list` で実際のワークツリー名を確認

### 削除に失敗する場合
- 該当ディレクトリでプロセスが実行中でないか確認
- MinIOがストレージディレクトリを使用していないか確認
- 必要に応じて手動でプロセスを終了
