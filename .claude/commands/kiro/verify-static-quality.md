---
description: Biome・TypeScript・テストの静的品質検証
allowed-tools: Bash, Read, Write
argument-hint: <feature-name>
---

# verify-static-quality

対象フィーチャー: **$1**

## 目的
AI が生成した実装が最低限の静的品質基準（Biome/TypeScript/テスト）を満たしているかを確認する。

## 前提
- 対象タスクの差分が git に残っている
- 必要な環境変数が設定済み

## 手順
1. 差分確認
   - `git status`
   - `git diff`
2. Biome チェック
   - `pnpm biome check --write .`
   - エラーが出たファイルは差分で要確認。AI 由来の過剰な複雑化が疑われる場合は `pnpm biome lint --write` → 再検討。
3. TypeScript 型検証
   - `pnpm typecheck`
   - 失敗時は修正後に再実行。修正で構造が複雑になっていないか `git diff` で確認。
4. テスト
   - 必須: `pnpm test:unit`
   - タスク内容に応じて `pnpm test:integration`, `pnpm test:storage`, `pnpm test:e2e`
   - 必要に応じて `pnpm test:all`
5. 結果記録
   - 成功/失敗を `.kiro/specs/$1/verification/spec-verify-checklist.md` の該当欄に反映。

## 注意
- LLM が型を通すためだけに複雑なコードを挿入していないか、差分で必ず確認。
- テストが失敗した場合は、落ちたテスト名・原因を障害メモへ記録。
