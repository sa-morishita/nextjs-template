DHH哲学に基づくNext.js App Routerコード品質チェック

---

allowed-tools: ["Bash", "Read", "Edit", "MultiEdit", "Grep", "Glob", "TodoWrite", "TodoRead", "mcp__brave-search__brave_web_search"]
description: "DHHのコード品質哲学をNext.js App Routerに適応したステージングファイルの統合品質評価"

---

# quality-dhh

DHH（David Heinemeier Hansson）のコード品質哲学をNext.js App Router、TypeScript、React 19に適応させた包括的なコード品質チェックを実行します。

## DHHコード哲学 × Next.js

### 核となる価値観

- **DRY (Don't Repeat Yourself)**: 重複の排除、適切な抽象化
- **Concise**: 必要最小限、簡潔性重視  
- **Elegant**: 自然で美しいソリューション
- **Expressive**: コードが意図を明確に表現
- **Idiomatic**: フレームワークの慣用句に従う
- **Self-documenting**: コメントに頼らない自己文書化

## Instructions

### 1. 初期設定とタスク管理

TodoWriteツールで以下のタスクリストを作成：

- ステージングファイルの取得と分析
- Next.js App Router適合性チェック
- DHH品質基準による評価
- TypeScript/React固有の品質評価
- アーキテクチャパターン準拠確認
- 改善提案と具体例の作成
- 総合品質レポートの作成

### 2. ステージングファイルの取得

```bash
# ステージングされたファイルを取得
git diff --cached --name-only --diff-filter=ACMR

# ファイルタイプと変更状況を確認
git diff --cached --name-status
```

対象外ファイル（.gitignore、package.json、設定ファイル等）は除外し、実装コードのみを評価対象とする。

### 3. Next.js App Router適合性チェック

#### 🏗️ コンポーネント設計の評価

**Server Components vs Client Components**
- Server Components優先の設計になっているか
- `use client`の使用が最小限で適切か
- データフェッチングがServer Componentで行われているか
- Client Componentは相互作用が必要な場合のみか

**コンポーネント分離**
- Container/Presentational パターンの適用状況
- 単一責任原則の遵守
- プロップドリリングの回避
- 適切なコンポーネント境界

#### 📁 ファイル構造とルーティング

**App Router規約の遵守**
- ディレクトリ構造がURL構造に対応
- `page.tsx`, `layout.tsx`, `loading.tsx`の適切な配置
- Route Groupsの適切な使用
- 並行ルートやインターセプトルートの妥当性

**命名規則**
- ファイル名：lowercase-with-dashes
- 関数名：適切なプレフィックス（get*, create*, update*, delete*）
- 型定義：interfaces優先、enum禁止

### 4. DHH品質基準による評価

#### 💎 エレガンス評価

**「Rails-worthy」基準をNext.js用に翻訳**
- Next.js core に採用されるレベルのコードか
- フレームワークと調和しているか（戦わずに流れに沿っているか）
- 実装が自明で予測可能か

**抽象化の適切性**
- 過度な抽象化を避けているか
- 必要な時のみの抽象化か
- Conceptual Compression（概念の圧縮）ができているか

#### 🔧 実用性評価

**Convention over Configuration**
- Next.js/Reactの慣例に従っているか
- プロジェクト固有の設定を最小化
- デフォルトの動作を活用

**Programmer Happiness**
- 開発者が喜んで書ける/読めるコードか
- メンテナンスが苦痛でないか
- 拡張しやすい設計か

### 5. TypeScript/React固有の品質評価

#### 🎯 型安全性

**型定義の品質**
- `any`型の使用禁止（絶対零容量）
- `as`による型アサーションの最小化
- 適切なジェネリクスの使用
- Props型の明確性

**React固有のパターン**
- Hooks の適切な使用
- Effect の依存関係配列の正確性
- メモ化（memo, useMemo, useCallback）の適切な使用
- エラーバウンダリの実装

#### ⚡ パフォーマンス観点

**Next.js パフォーマンス**
- 適切なStreaming/Suspenseの使用
- Dynamic Imports の活用
- Image最適化の実装
- バンドルサイズへの配慮

**React最適化**
- 不要な再レンダリングの回避
- 重い計算処理の最適化
- リストレンダリングのkey設定

### 6. アーキテクチャパターン準拠確認

#### 📐 プロジェクト固有パターンの評価

**CLAUDE.mdで定義されたパターン**
- Container/Presentational パターンの適用
- actions → usecases → mutations/queries フロー
- エラーハンドリングパターン（next-safe-action使用）
- キャッシングパターン（タグベース）

**ディレクトリ構造の遵守**
- `components/`、`lib/`、`app/`の適切な使い分け
- 機能別のファイル配置
- テストファイルの配置規則

### 7. コード評価基準

#### 🚨 Critical Issues（修正必須）

- フレームワーク規約違反
- 型安全性の重大な問題
- パフォーマンスに深刻な影響
- セキュリティ問題
- アーキテクチャの根本的な違反

#### ⚠️ Improvements Needed（改善推奨）

- DRY原則違反
- 過度な複雑性
- 命名規則の問題
- テスタビリティの問題
- アクセシビリティの配慮不足

#### ✅ What Works Well（評価ポイント）

- エレガントなソリューション
- 適切な抽象化
- フレームワークとの調和
- 型安全性の活用
- パフォーマンス配慮

### 8. 改善提案と具体例

#### Before/After コード例

**悪い例**（DHH基準不合格）
```typescript
// 過度な抽象化、不要な複雑性
export const useComplexDataManager = <T extends BaseEntity>(
  config: DataManagerConfig<T>
) => {
  // 100行のロジック...
}
```

**良い例**（DHH基準合格）
```typescript
// シンプル、直接的、表現豊か
export async function getTodos(userId: string) {
  return db.todo.findMany({ where: { userId } })
}
```

#### リファクタリング手順

1. **削除ファースト**: 不要なコードの削除
2. **抽象化の見直し**: 過度な抽象化の解除
3. **型の強化**: anyの排除、適切な型定義
4. **命名の改善**: より表現力のある名前
5. **フレームワーク活用**: Next.js/React機能の最大活用

### 9. 品質スコアリング

#### DHH品質基準（10点満点）

- **エレガンス**: 自然で美しいソリューション（2点）
- **簡潔性**: 必要十分な実装（2点）
- **表現力**: 意図が明確（2点）
- **慣用性**: フレームワーク準拠（2点）
- **保守性**: 変更容易性（2点）

#### 各項目評価基準

- **9-10点**: Next.js core採用レベル
- **7-8点**: 優秀なプロダクションコード
- **5-6点**: 標準的なコード
- **3-4点**: 改善が必要
- **1-2点**: 根本的な見直しが必要

### 10. 総合レポート作成

```
🎯 DHH品質基準 × Next.js App Router コードレビュー
======================================================

📊 品質スコア（50点満点）
------------------------
- エレガンス: [X]/10 - [具体的な評価理由]
- 簡潔性: [X]/10 - [具体的な評価理由]  
- 表現力: [X]/10 - [具体的な評価理由]
- 慣用性: [X]/10 - [具体的な評価理由]
- 保守性: [X]/10 - [具体的な評価理由]

総合スコア: [XX]/50

🚨 Critical Issues
------------------
[修正必須項目をリスト]

⚠️ 改善推奨事項
---------------
[DHH基準から見た改善点をリスト]

✅ 優秀な実装
-----------
[DHH基準に合致する良いコード例]

🔧 リファクタリング提案
--------------------
[具体的なBefore/After例と手順]

🎯 Next Steps
------------
[優先順位付きの改善アクション]

📝 DHH判定
----------
□ Next.js core 採用レベル
□ プロダクション品質
□ 改善推奨
□ 根本的見直し必要

💬 DHH風コメント
---------------
[DHHの視点からの率直な評価コメント]
```

## 使用方法

### 基本実行

```
/code:quality-dhh
```

### 特定の観点に集中

```
/code:quality-dhh --focus=components
/code:quality-dhh --focus=architecture
/code:quality-dhh --focus=performance
```

## 成功基準

1. **DHH品質基準**: 40/50点以上
2. **Critical Issues**: 0件
3. **Next.js準拠**: フレームワーク規約違反0件
4. **型安全性**: any型使用0件
5. **総合判定**: "プロダクション品質"以上

## 重要な原則

1. **実用主義**: 現実的で実装可能な提案
2. **段階的改善**: 一度にすべてを解決しない
3. **フレームワーク尊重**: Next.js/Reactの哲学に従う
4. **型安全性**: TypeScriptの恩恵を最大活用
5. **開発者体験**: 書きやすく、読みやすく、保守しやすく

コードは機能するだけでなく、"joy to read and maintain"であるべきです。DHHの追求する美しく表現豊かなコードを、Next.js App Routerの世界で実現しましょう。