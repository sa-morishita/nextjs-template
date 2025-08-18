技術情報の調査と最新情報の収集

---

allowed-tools: ["Bash", "mcp__brave-search__brave_web_search", "mcp__context7__resolve-library-id", "mcp__context7__get-library-docs"]
description: "公式ドキュメントを優先して技術情報を検索"

---

# research

ライブラリの使い方、実装方法、エラー解決など、幅広い技術情報を調査します。

## Instructions

1. 調査対象の確認
   調査内容: $ARGUMENTS

2. 公式情報の優先取得

   **Step 1: MCP Context7で公式ドキュメントを確認**

   ライブラリに関する調査の場合、まずContext7で公式情報を取得：
   1. `mcp__context7__resolve-library-id` でライブラリIDを解決
   2. `mcp__context7__get-library-docs` で公式ドキュメントを取得

   Context7で取得可能な例：
   - React, Next.js, TypeScript
   - Vitest, Jest
   - Tailwind CSS
   - その他主要なJavaScript/TypeScriptライブラリ

   **注意**: ライブラリの公式情報以外（設定方法、統合方法、一般的な問題など）はContext7では取得できないため、Step 2へ進む

   **Step 2: Brave MCPで追加情報を検索**

   Context7で解決しない場合、またはライブラリ以外の問題の場合：

   まず現在の年月を取得（最新情報を確実に取得するため）：
   !date '+%Y年%m月'

   **検索戦略**：
   - 取得した年月を検索クエリに含める（AIの知識が古い可能性があるため）
   - 具体的なトピックやキーワードを含める
   - 公式サイトやGitHub公式リポジトリを優先

   **検索クエリの例**：
   - 使い方: "Next.js 15 app router best practices 2025年8月"
   - 実装方法: "React Server Components implementation guide 2025"
   - エラー解決: "[エラーコード] TypeScript official docs 2025年8月"
   - 統合方法: "Supabase Next.js integration site:supabase.com 2025"
   - パフォーマンス: "React performance optimization techniques 2025"

3. 情報源の優先順位
   1. **公式情報（最優先）**：
      - MCP Context7の公式ドキュメント
      - 公式サイト（site:指定で検索）
      - 公式GitHub Issues/Discussions
      - 公式ブログやリリースノート

   2. **準公式・信頼性の高い情報**：
      - Stack Overflow（最新の回答を優先）
      - GitHub上の有名なサンプルプロジェクト
      - MDN Web Docs（Web標準関連）

   3. **コミュニティリソース**：
      - Reddit（r/typescript, r/nextjs等）
      - Zenn、Qiitaの最新記事
      - 技術ブログ（日付を確認）

4. 収集した情報の整理

   **重要なポイント**：
   - 解決策の要約
   - 実装例やコードサンプル
   - 注意事項や副作用
   - 代替案（複数ある場合）

## 使用例

```
/dev:research Next.js 15 App Router の使い方
/dev:research React Server Components のベストプラクティス
/dev:research Supabase と Next.js の統合方法
/dev:research TypeScript error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
/dev:research Vitest でReact Hookのテスト方法
/dev:research Tailwind CSS v4 の新機能
```

## 効果的な使い方

1. **具体的なトピックやキーワード**を含める
2. **使用しているバージョン**を明記する
3. **関連するライブラリ名**を含める
4. 複数の検索を試して**幅広い情報**を収集

## 重要な方針

### 公式情報を最優先

1. **ライブラリ関連**: まずContext7で公式ドキュメントを確認してから他の情報源へ
2. **その他の問題**: Brave MCPで公式サイトを優先的に検索
3. **信頼性の確認**: 情報源の公式性と日付を必ず確認

### 注意事項

- AIの知識は古い可能性があるため、必ず現在の年月を含めて検索
