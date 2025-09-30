---
description: セキュリティ・ログ・品質の最終確認
allowed-tools: Bash, Read, Write
argument-hint: <feature-name>
---

# verify-security-quality

対象フィーチャー: **$1**

## 目的
依存関係の脆弱性、Server Action の安全性、ログ基準、ドメインロジックの健全性を確認する。

## 手順
1. 依存脆弱性スキャン
   - `pnpm audit --audit-level=high`
   - 問題が出たら内容を精査し、必要に応じて依存を更新・差し戻し。
2. セキュリティ静的解析
   - `npx semgrep --config p/nextjs --config p/security-audit`
   - 未導入の場合は `pnpm add -D semgrep` の案内をチェックリストに記録。
3. Server Action 入力検証
   - `lib/actions/` 配下変更ファイルを確認し、`next-safe-action` の `.inputSchema` や Zod 検証があるか確認。
4. ログ基準
   - サーバーサイドのログ出力が `@/lib/utils/logger` 経由か `rg "console\\.(log|error|warn)" src` で確認。
   - 本番環境で `logger.error` のみになる設計方針に反していないか確認。
5. ドメインロジック健全性
   - 差分で不自然な複雑化（条件ネスト過多など）がないかレビュー。

## 記録
- `.kiro/specs/$1/verification/spec-verify-checklist.md` の該当欄に結果を記入。
- 課題があれば障害メモとレポートテンプレートに明記。
