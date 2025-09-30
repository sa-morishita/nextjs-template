---
description: 手動コード検証の進行表
allowed-tools: Read, Write, Edit
argument-hint: <feature-name>
---

# AI実装コード検証チェックリスト

対象フィーチャー: **$1**

## 使い方
- このファイルを `.kiro/specs/$1/verification/spec-verify-checklist.md` にコピーしてから作業を開始。
- 下記セクションの順に実施し、完了した項目は `[ ]` を `[x]` に書き換える。
- 途中でNGが出た場合は差分修正 → 再チェック。問題を記録する場合は「障害メモ」を活用。

## 1. 事前確認
- [ ] `git status` がクリーンまたは検証対象差分のみである
- [ ] `.kiro/specs/$1/spec.json` の `phase` が `tasks-generated` 以上になっている
- [ ] `.kiro/specs/$1/tasks.md` に今回対象タスクが明記されている

## 2. 静的品質チェック (`verify-static-quality`)
実行ファイル: `.claude/commands/kiro/verify-static-quality.md`
- [ ] Biome / TypeScript / 自動テスト手順を完了
- [ ] 失敗があれば修正し、再実行で全て成功

## 3. Next.js App Router 構造チェック (`verify-app-router-structure`)
実行ファイル: `.claude/commands/kiro/verify-app-router-structure.md`
- [ ] App Router の配置ルール遵守を確認
- [ ] Suspense・Server/Client コンポーネント方針に逸脱がない

## 4. セキュリティ & ログ基準チェック (`verify-security-quality`)
実行ファイル: `.claude/commands/kiro/verify-security-quality.md`
- [ ] 依存脆弱性・Semgrep の結果に問題なし
- [ ] Server Action の入力検証・ログガイドライン遵守を確認

## 5. 障害メモ
- 発生した問題と対処: （必要に応じて記入）

## 6. レポートテンプレート
```
対象: $1
静的品質: OK / NG
App Router: OK / NG
Security: OK / NG
補足:
```

## 7. 次のステップ
- 全項目が `[x]` になったら、レビュー担当者へ「レポートテンプレート」を添えて報告。
- 必要に応じて `/kiro:spec-status $1` で進捗確認。
