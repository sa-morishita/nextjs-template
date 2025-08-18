重要なビジネスロジックの結合テストの不足を探す

---

allowed-tools: ["Task", "Read", "Glob", "Grep", "TodoWrite"]
description: "usecases, queries, mutations, servicesで結合テストが不足している重要な箇所を特定"

---

# find-missing-integration-tests

プロジェクト内のビジネスロジック層（usecases → queries/mutations → services）を分析し、結合テストが不足している重要な箇所を特定します。

## Instructions

1. TodoWriteツールを使用してタスクリストを作成
   - usecasesの分析（最優先）
   - queries/mutationsの分析
   - servicesの分析（外部サービスの扱いを検討）

2. 対象ファイルの探索と分析
   - `src/lib/usecases/*.ts` - ビジネスロジックの中核（最優先）
   - `src/lib/queries/*.ts` - データ取得ロジック
   - `src/lib/mutations/*.ts` - データ更新ロジック
   - `src/lib/services/*.ts` - 外部サービス連携

3. 既存の結合テストファイルを確認
   - `**/*.integration.test.ts` パターンで検索
   - 対応するテストがあるかマッピング

4. 各モジュールの重要度評価
   - **高優先度の判断基準**:
     - 複数テーブルへのアクセス
     - トランザクション処理
     - 複雑なビジネスルール
     - 認証・認可ロジック
     - お金や重要なデータを扱う処理
   - **中優先度の判断基準**:
     - 単一テーブルへの複雑なクエリ
     - データの整合性チェック
     - キャッシュ処理
   - **低優先度の判断基準**:
     - 単純なCRUD操作
     - 外部ライブラリへの薄いラッパー

5. 外部サービスの扱い方針
   - **services層の外部サービス**:
     - メール送信: モックで十分（実際の送信は不要）
     - 画像アップロード: ローカルストレージでのテスト
     - 認証プロバイダ: インメモリ実装でテスト
   - **usecases層での外部サービス利用**:
     - 外部サービスへの依存は注入可能にする
     - テスト時はモック実装を注入
     - 実装への提案も含める

6. 結果のまとめ
   - レイヤー別（usecases → queries/mutations → services）
   - 優先順位付き
   - 外部サービスのテスト戦略提案付き

## 出力形式

```markdown
## 結合テストが不足している重要モジュール

### 1. Usecases層（最優先）

#### 優先度：高

- **usecase名** (`src/lib/usecases/xxx.ts`)
  - 主要機能: 何をするモジュールか
  - 依存関係: queries/mutations/services
  - テスト観点: 重要なビジネスルール
  - 外部サービス: ある場合はテスト戦略提案

#### 優先度：中

...

### 2. Queries/Mutations層

#### 優先度：高

- **モジュール名** (`src/lib/xxx/yyy.ts`)
  - 主要機能: データ操作の概要
  - 複雑度: トランザクション、JOIN等
  - テスト観点: データ整合性、エラーケース

### 3. Services層

#### 外部サービスのテスト戦略

- **service名**: 推奨テスト方法

## 推奨実装順序

1. 最優先でテストすべきusecase
2. 関連するqueries/mutations
3. 外部サービスのモック戦略

## 外部サービスの扱い提案

- 各サービスのテスト時の推奨アプローチ
```

## 使用例

```
/test:find-missing-integration-tests
```

このコマンドにより、PGLiteとファクトリーを使った結合テストが必要な重要箇所を効率的に特定し、外部サービスの適切なテスト戦略も提案します。
