GitHub ActionsのSecretsをenvファイルから登録

---
allowed-tools: ["Bash", "Read"]
description: "GitHub Actions環境（preview/production）にシークレットを登録"
---

# register-secrets

指定された環境（preview または production）のGitHub Actionsシークレットを、対応する.envファイルから一括で登録します。

## Instructions

1. 引数の検証
   環境名を確認: $ARGUMENTS

   有効な値:
   - preview
   - production

2. 環境名が指定されていない場合のエラー処理
   !echo "エラー: 環境名を指定してください (preview または production)"
   !echo "使用方法: /git:arg-register-secrets preview"
   !exit 1

3. 対応するenvファイルの存在確認
   ```bash
   ENV_NAME="$ARGUMENTS"
   ENV_FILE=".env.github-actions.${ENV_NAME}"

   if [ ! -f "$ENV_FILE" ]; then
     echo "エラー: ${ENV_FILE} ファイルが見つかりません"
     echo "先に ${ENV_FILE}.example をコピーして値を設定してください"
     exit 1
   fi
   ```

4. 現在のリポジトリ情報を取得
   !gh repo view --json nameWithOwner -q .nameWithOwner

5. 環境の存在確認（GitHub上）
   !gh api repos/{owner}/{repo}/environments --jq '.environments[].name' | grep -q "^${ENV_NAME}$"

   環境が存在しない場合は作成を促す：
   ```
   echo "警告: GitHub上に '${ENV_NAME}' 環境が存在しません"
   echo "GitHubのSettings > Environments から環境を作成してください"
   ```

6. シークレット登録の実行
   !gh secret set -f "$ENV_FILE" --env "$ENV_NAME"

7. 登録結果の確認
   !echo "✅ ${ENV_NAME} 環境へのシークレット登録が完了しました"

8. 登録されたシークレットの一覧表示
   !gh secret list --env "$ENV_NAME"

9. セキュリティに関する注意事項
   ```
   echo ""
   echo "⚠️  セキュリティ上の注意:"
   echo "- .env.github-actions.* ファイルは絶対にGitにコミットしないでください"
   echo "- .gitignoreに含まれていることを確認してください"
   echo "- 定期的にシークレットを更新することを推奨します"
   ```

## 使用例

```bash
# Preview環境にシークレットを登録
/git:arg-register-secrets preview

# Production環境にシークレットを登録
/git:arg-register-secrets production
```

## 前提条件

1. GitHub CLIがインストールされ、認証済みであること
2. リポジトリへの書き込み権限があること
3. 対応する.env.github-actions.{環境名}ファイルが存在すること
4. GitHub上に対象の環境が作成されていること

## トラブルシューティング

### "environment not found" エラーの場合
GitHubのリポジトリ設定から環境を作成してください：
Settings → Environments → New environment

### 権限エラーの場合
```bash
gh auth refresh -s write:packages,repo
```

### 特定のシークレットのみ更新したい場合
```bash
gh secret set SECRET_NAME --env preview --body "new-value"
```
