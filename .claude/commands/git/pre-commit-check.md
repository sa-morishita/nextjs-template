コミット前の全チェック項目を実行してエラーを修正

---

allowed-tools: ["Bash", "Read", "Edit", "MultiEdit", "mcp__brave-search__brave_web_search"]
description: "lefthook.ymlのpre-commitチェックを全て実行し、エラーを修正"

---

# pre-commit-check

lefthook.ymlに定義されているpre-commitチェック項目を全て実行し、エラーがある場合は修正します。

## 重要な原則

### エラー発生時は即座に情報収集

**どのチェック項目でもエラーが発生したら、あなたが持っている知識だけで試行錯誤せず、すぐに最新情報を収集してください。**

情報収集には以下のファイルに記載されている内容を確認して実行してください：

```
@.claude/commands/dev/research.md
```

引数として [エラー内容やエラーコード] を渡してください。

このファイルには以下の処理が記載されています：

- 現在の年月を取得して最新情報を検索
- Brave MCPで幅広い情報源から解決策を収集
- MCP Context7で公式ドキュメントを確認（利用可能な場合）

### TypeScript修正時の禁止事項

- `any` 型の使用は**絶対禁止**
- `as` によるタイプアサーションは**絶対禁止**
- どうしても解決できない場合は、ユーザーに承認を求める

## Instructions

1. lefthook.ymlファイルを確認してpre-commitのチェック項目を特定
   !cat lefthook.yml | grep -A 20 "pre-commit:"

2. 確認したpre-commitチェック項目を実行
   プロジェクトのlefthook.ymlに定義されている全てのpre-commitコマンドを実行する。
   例えば以下のような項目が含まれる可能性がある：
   - biome/eslintなどのリンター
   - typecheckなどの型チェック
   - 各種テスト（unit、integration、e2eなど）
   - その他プロジェクト固有のチェック

3. エラーが発生した場合の対処法：

   **全てのエラーに共通する手順：**

   researchコマンドを使用して最新情報を収集：

   ```
   以下のファイルの内容を確認して実行してください：
  @.claude/commands/dev/research.md
  引数: [具体的なエラーメッセージまたはエラーコード]
   ```

   例：
   - `/dev:research TypeScript error TS2345`
   - `/dev:research Biome no-console rule error`
   - `/dev:research Vitest mock not working Next.js 15`

   収集した情報に基づいて修正を実施。

4. 修正後、再度lefthook.ymlに定義されている全てのpre-commitチェックを実行

5. 全てのチェックが成功するまで手順3-4を繰り返す

6. 最終確認
   - 全てのチェックが ✔️ で成功していることを確認
   - 🥊 マークがないことを確認

## 特定のエラータイプへの対応ガイド

### Lintエラー（Biome/ESLint等）

- 自動修正オプション（--write等）がある場合は先に試す
- 自動修正できない場合は、エラー内容を検索して最新の解決方法を適用

### 型エラー（TypeScript）

- 最新の型定義やジェネリクスの使用方法を検索
- Union型、型ガード、unknownを活用
- `any`や`as`は使用禁止

### テストエラー

- テストフレームワーク固有の問題は公式ドキュメントで確認
- モック、非同期処理、タイムアウトの設定を見直し

## 成功時の出力例

```
✔️ biome: 成功
✔️ typecheck: 成功
✔️ test-unit: 成功
✔️ test-integration: 成功
```

全てのチェックが成功したら、安全にコミットできる状態です。
