---
description: Next.js App Router 構造とベストプラクティス確認
allowed-tools: Bash, Read, Write
argument-hint: <feature-name>
---

# verify-app-router-structure

対象フィーチャー: **$1**

## 目的
App Router のファイル構成・Server/Client コンポーネント境界・Suspense 運用が設計方針と最新ベストプラクティスに沿っているか確認する。

## 手順
1. ファイル配置と命名
   - `rg "export default function" app/$1` などで対象ルート配下を把握。
   - `page.tsx`, `layout.tsx`, `loading.tsx` の配置を設計書と照合。
2. Server/Client コンポーネント境界
   - `rg "'use client'" app/$1` で Client Component の位置を確認。必要最小限に留まっているか判断。
   - `_containers/<feature>/container.tsx` が Server Component、`_components/` 配下が Client Component になっているか確認。
3. Suspense・データ取得
   - `page.tsx` が Suspense 境界を適切に設定しているか確認。
   - データ取得は Server Component で実行し、Client Component ではロジックを持たせない方針を守る。
4. ESLint (Next.js ルール)
   - `pnpm exec next lint --max-warnings=0`
   - 違反が出た場合は修正後に再実行。
5. ログ方針確認
   - サーバーサイドで `@/lib/utils/logger` を使用しているか `rg "logger\." src` で確認。

## 記録
- 結果を `.kiro/specs/$1/verification/spec-verify-checklist.md` の該当欄に反映。
- 逸脱があれば障害メモに詳細を記載。
