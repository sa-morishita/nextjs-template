# Claude Code カスタムスラッシュコマンド完全ガイド

このガイドでは、Claude Codeで使用できるカスタムスラッシュコマンドの作成方法とベストプラクティスについて説明します。

## 概要

カスタムスラッシュコマンドは、繰り返し使用するプロンプトやワークフローを`/command_name`という簡潔な形式で呼び出せる機能です。これにより、開発作業の効率化と標準化が可能になります。

## ファイル構造とセットアップ

### コマンドの保存場所

カスタムコマンドは以下の2つの場所に配置できます：

1. **プロジェクト固有のコマンド**: `.claude/commands/`
2. **個人用グローバルコマンド**: `~/.claude/commands/`

### ディレクトリ構造の例

```
.claude/
└── commands/
    ├── dev/
    │   ├── optimize.md
    │   └── refactor.md
    ├── test/
    │   ├── unit.md
    │   └── integration.md
    └── project/
        ├── setup.md
        └── deploy.md
```

## コマンドファイルの基本構造

### 重要: ファイルの1行目について

**コマンドファイルの1行目は、Claude Codeのコマンド一覧に表示される説明文になります。** frontmatterを使用する場合でも、必ず1行目に簡潔な説明を記載してください。

### 最小限のテンプレート

```markdown
コマンドの簡潔な説明（この行がコマンド一覧に表示される）

# コマンド名

詳細な説明。

## Instructions

1. 具体的な実装手順
2. 必要なチェック項目
3. 完了条件
```

### 高度なテンプレート（frontmatter付き）

```markdown
コマンドの簡潔な説明（この行がコマンド一覧に表示される）

---
allowed-tools: ["Read", "Edit", "Bash", "Write"]
description: "コードのパフォーマンス最適化を行います"
model: "claude-3-opus-20240229"
---

# optimize

このコマンドは、指定されたコードのパフォーマンス最適化を行います。

## Instructions

1. 対象ファイルを読み込む: $ARGUMENTS
2. パフォーマンスボトルネックを特定
3. 最適化案を提示
4. ユーザーの承認を得て実装
```

## 命名規則とベストプラクティス

### 命名規則

- **小文字のみ使用**: `create-feature.md` ✓
- **ハイフンで単語を区切る**: `code-review.md` ✓
- **アンダースコアも使用可能**: `test_runner.md` ✓
- **簡潔で説明的な名前**: `fix-lint.md` ✓

### ネームスペースの活用

サブディレクトリを使用してコマンドを整理：

```
/dev:optimize    # 開発関連の最適化
/test:unit       # テスト関連のユニットテスト
/project:setup   # プロジェクト固有のセットアップ
```

## 引数とプレースホルダー

### $ARGUMENTS プレースホルダー

ユーザーからの入力を受け取る：

```markdown
# analyze

## Instructions

以下のコードを分析してください：
$ARGUMENTS

1. コードの品質をチェック
2. 潜在的な問題を特定
3. 改善案を提示
```

使用例：
```
/analyze src/components/Button.tsx
```

### $ARGUMENTS の動作について

**重要**: `$ARGUMENTS` はClaude Codeによって自動的に置換されます：
- **テキスト内**: マークダウン内のテキストとして `$ARGUMENTS` を記述すると、そのまま引数に置換されます
- **bashコマンド内**: `!` で始まるbashコマンド内でも `$ARGUMENTS` は正しく引数として渡されます

例：
```markdown
## Instructions

1. 引数の表示（テキスト内）
   受け取った引数: $ARGUMENTS

2. bashコマンドでの使用
   !echo "引数は: $ARGUMENTS"
   !bash script.sh $ARGUMENTS
```

`/command 123` を実行すると：
- テキスト内: "受け取った引数: 123"
- bashコマンド: `echo "引数は: 123"` および `bash script.sh 123` が実行される

### 複数の引数パターン

```markdown
# create-component

## Instructions

コンポーネント情報を解析：
$ARGUMENTS

期待される形式：
- 第1引数: コンポーネント名
- 第2引数: コンポーネントタイプ（optional）
- 第3引数: 配置ディレクトリ（optional）
```

**注意**: 複数の引数は全て `$ARGUMENTS` に含まれるため、bashスクリプト側で適切に処理する必要があります。

## 実用的なコマンド例

### 1. コードレビューコマンド

```markdown
---
allowed-tools: ["Read", "Grep", "Glob"]
description: "PRのコードレビューを実施"
---

# code-review

指定されたファイルまたはディレクトリのコードレビューを行います。

## Instructions

1. 対象ファイルを特定: $ARGUMENTS
2. 以下の観点でレビュー：
   - コーディング規約の遵守
   - パフォーマンスの懸念事項
   - セキュリティリスク
   - テストカバレッジ
   - リファクタリングの機会
3. 改善提案を優先度付きでリスト化
4. 必要に応じて修正例を提示
```

### 2. テスト生成コマンド

```markdown
---
allowed-tools: ["Read", "Write", "Edit"]
description: "指定ファイルのユニットテストを生成"
---

# generate-test

## Instructions

1. ターゲットファイルを読み込む: $ARGUMENTS
2. ファイルの機能を分析
3. 既存のテストパターンを確認
4. 包括的なテストケースを生成：
   - 正常系テスト
   - 異常系テスト
   - エッジケース
5. プロジェクトのテスト規約に従う
```

### 3. パフォーマンス最適化コマンド

```markdown
---
allowed-tools: ["Read", "Edit", "Bash"]
description: "React コンポーネントのパフォーマンス最適化"
---

# optimize-react

React コンポーネントのレンダリングパフォーマンスを最適化します。

## Instructions

1. 対象コンポーネントを分析: $ARGUMENTS
2. パフォーマンス問題を特定：
   - 不要な再レンダリング
   - 重い計算処理
   - 大きなリストのレンダリング
3. 最適化手法を適用：
   - React.memo の追加
   - useMemo/useCallback の使用
   - 仮想スクロールの実装
4. ビフォー/アフターの比較を提示
```

## 高度な機能

### 1. bashコマンドの実行

```markdown
# setup-project

## Instructions

!npm install
!npm run build
プロジェクトのセットアップが完了しました。
```

### 2. ファイル参照

```markdown
# implement-pattern

## Instructions

@src/patterns/repository.ts のパターンに従って
$ARGUMENTS に新しいリポジトリを実装します。
```

### 3. 条件付き処理

```markdown
# smart-refactor

## Instructions

1. ファイルタイプを判定: $ARGUMENTS
2. 言語別の最適化：
   - TypeScript: 型の最適化、非同期処理の改善
   - React: コンポーネント分割、hooks の抽出
   - CSS: 重複の削除、変数化
3. 適切なリファクタリングを実行
```

## カテゴリ別コマンド例

### 開発ワークフロー

#### /dev:feature
```markdown
---
allowed-tools: ["Read", "Write", "Edit", "Bash", "TodoWrite"]
description: "新機能の実装を体系的に進める"
---

# feature

新機能を実装するための構造化されたワークフローです。

## Instructions

機能要件を分析: $ARGUMENTS

1. TodoWriteツールを使用してタスクリストを作成
2. 影響範囲の調査
   - 既存コードの確認
   - 依存関係の特定
3. 実装計画の作成
4. 段階的な実装
   - スキーマ/型定義
   - ビジネスロジック
   - UI コンポーネント
   - テスト
5. 統合テストの実行
```

#### /dev:debug
```markdown
---
allowed-tools: ["Read", "Grep", "Bash", "Edit"]
description: "バグの調査と修正"
---

# debug

エラーやバグを体系的に調査し修正します。

## Instructions

問題の説明: $ARGUMENTS

1. エラーメッセージまたは症状を分析
2. 関連ファイルを特定（Grep使用）
3. スタックトレースを追跡
4. 根本原因を特定
5. 修正案を提示
6. 修正を実装
7. 回帰テストを確認
```

### コード品質

#### /quality:refactor
```markdown
---
allowed-tools: ["Read", "Edit", "MultiEdit"]
description: "コードのリファクタリング"
---

# refactor

コードの品質を向上させるリファクタリングを実行します。

## Instructions

対象ファイル: $ARGUMENTS

1. コードの問題点を特定：
   - 重複コード
   - 複雑な条件分岐
   - 長すぎる関数
   - 不適切な命名
2. リファクタリング戦略を決定
3. 段階的に改善：
   - 関数の抽出
   - 変数名の改善
   - 型の強化
   - コメントの追加
4. テストが通ることを確認
```

#### /quality:lint-fix
```markdown
---
allowed-tools: ["Bash", "Edit", "MultiEdit"]
description: "Lintエラーの自動修正"
---

# lint-fix

プロジェクト全体のLintエラーを修正します。

## Instructions

1. !pnpm biome check --write .
2. 自動修正できなかったエラーを確認
3. 手動で修正が必要な項目をリスト化
4. 各エラーを個別に修正
5. !pnpm typecheck で型エラーを確認
6. 必要に応じて型定義を修正
```

### テスト関連

#### /test:create
```markdown
---
allowed-tools: ["Read", "Write", "Glob"]
description: "包括的なテストケースを作成"
---

# create-test

指定されたファイルの包括的なテストを作成します。

## Instructions

テスト対象: $ARGUMENTS

1. 対象ファイルの機能を分析
2. 既存のテストパターンを確認（Glob: **/*.test.{ts,tsx}）
3. テストケースを設計：
   - 正常系
   - 異常系/エラーケース
   - 境界値テスト
   - モックが必要な依存関係
4. プロジェクトのテスト規約に従ってテストを実装
5. カバレッジを確認
```

#### /test:integration
```markdown
---
allowed-tools: ["Read", "Write", "Bash"]
description: "統合テストの作成と実行"
---

# integration-test

API エンドポイントや複数コンポーネントの統合テストを作成します。

## Instructions

テスト対象の機能: $ARGUMENTS

1. 統合テストのスコープを定義
2. 必要なテストデータを準備
3. *.integration.test.ts ファイルを作成
4. テストシナリオを実装：
   - ユーザーフローのテスト
   - API レスポンスの検証
   - エラーハンドリング
5. !pnpm test:integration でテスト実行
```

### データベース操作

#### /db:migration
```markdown
---
allowed-tools: ["Read", "Write", "Edit", "Bash"]
description: "データベースマイグレーションの作成"
---

# create-migration

Drizzle ORM を使用したマイグレーションを作成します。

## Instructions

マイグレーションの内容: $ARGUMENTS

1. src/db/schema/ のスキーマファイルを確認
2. 必要な変更を特定
3. スキーマファイルを更新
4. !pnpm db:generate でマイグレーション生成
5. 生成されたSQLを確認
6. 開発環境で !pnpm db:push を実行
7. ロールバック手順を文書化
```

#### /db:seed
```markdown
---
allowed-tools: ["Read", "Write", "Bash"]
description: "テストデータのシード作成"
---

# seed-data

開発/テスト用のシードデータを作成します。

## Instructions

シードデータの要件: $ARGUMENTS

1. 必要なデータ構造を分析
2. src/db/seed.ts を作成または更新
3. 以下を含むシードデータを設計：
   - 基本的なマスターデータ
   - テスト用ユーザー
   - サンプルデータ
4. トランザクション内で実行
5. 冪等性を保証（重複実行可能）
```

### セキュリティ

#### /security:audit
```markdown
---
allowed-tools: ["Bash", "Read", "Grep"]
description: "セキュリティ監査の実行"
---

# security-audit

プロジェクトのセキュリティ問題をチェックします。

## Instructions

1. !pnpm audit で依存関係の脆弱性チェック
2. 以下のパターンを検索：
   - ハードコードされた認証情報
   - SQLインジェクションリスク
   - XSS脆弱性
   - 安全でないAPI呼び出し
3. .env ファイルの適切な管理を確認
4. 認証/認可の実装を確認
5. 発見した問題と対策をレポート
```

### プロジェクト管理

#### /project:setup
```markdown
---
allowed-tools: ["Bash", "Write", "Edit"]
description: "プロジェクトの初期セットアップ"
---

# project-setup

新しい開発環境のセットアップを自動化します。

## Instructions

1. !pnpm install で依存関係をインストール
2. .env.example から .env をコピー
3. 必要な環境変数の説明を提供
4. !supabase start でローカルDBを起動
5. !pnpm db:push でスキーマを同期
6. !pnpm dev で開発サーバーを起動
7. セットアップ完了の確認手順を提示
```

#### /project:health-check
```markdown
---
allowed-tools: ["Bash", "Read"]
description: "プロジェクトの健全性チェック"
---

# health-check

プロジェクトの状態を包括的にチェックします。

## Instructions

1. 依存関係の確認
   - !pnpm audit
   - 古い依存関係の確認
2. コード品質
   - !pnpm check:all
   - テストカバレッジ確認
3. ビルドの確認
   - !pnpm build
4. 環境設定の確認
   - 必要な環境変数
   - 設定ファイルの整合性
5. 問題点と改善提案をまとめる
```

### Git ワークフロー

#### /git:prepare-pr
```markdown
---
allowed-tools: ["Bash", "TodoRead", "Edit"]
description: "PR作成の準備"
---

# prepare-pr

プルリクエスト作成前の準備を行います。

## Instructions

1. TodoReadで完了したタスクを確認
2. !git status で変更を確認
3. !pnpm check:all ですべてのチェックを実行
4. !pnpm test:all でテストを実行
5. コミットメッセージを準備
6. PR の説明文を作成：
   - 変更の概要
   - テスト方法
   - 関連するIssue
7. ブランチ名が適切か確認
```

### パフォーマンス最適化

#### /perf:analyze
```markdown
---
allowed-tools: ["Read", "Bash", "Write"]
description: "パフォーマンス分析と最適化"
---

# performance-analyze

コンポーネントやページのパフォーマンスを分析します。

## Instructions

分析対象: $ARGUMENTS

1. パフォーマンスボトルネックを特定：
   - 大きなバンドルサイズ
   - 不要な再レンダリング
   - 重い計算処理
   - N+1クエリ問題
2. 測定結果を記録
3. 最適化戦略を提案：
   - コード分割
   - メモ化
   - 遅延読み込み
   - キャッシング
4. 改善を実装
5. ビフォー/アフターを比較
```

## コマンド管理のベストプラクティス

### 1. バージョン管理

- `.claude/commands/` をGitで管理
- チーム間でコマンドを共有
- 変更履歴を追跡

### 2. ドキュメント化

各コマンドに以下を含める：
- 明確な目的説明
- 使用例
- 期待される結果
- 注意事項

### 3. テストとメンテナンス

- 定期的にコマンドの動作を確認
- プロジェクトの変更に合わせて更新
- 不要になったコマンドは削除

### 4. セキュリティ考慮事項

- `allowed-tools` で必要最小限のツールのみ許可
- 機密情報を含めない
- 破壊的な操作には確認ステップを追加

## トラブルシューティング

### コマンドが認識されない場合

1. ファイル名と拡張子を確認（`.md`必須）
2. ディレクトリパスを確認
3. Claude Codeを再起動

### 引数が正しく渡されない場合

1. `$ARGUMENTS` プレースホルダーの位置を確認
2. 引数の形式を明示的に説明

## 使用上のヒント

1. **コマンドの組み合わせ**: 複数のコマンドを順番に使用して複雑なタスクを完了
2. **カスタマイズ**: プロジェクト固有の要件に合わせてコマンドを調整
3. **チーム共有**: よく使うコマンドをチームで共有して標準化
4. **継続的改善**: 使用経験に基づいてコマンドを改良

## まとめ

カスタムスラッシュコマンドは、Claude Codeでの開発作業を大幅に効率化できる強力な機能です。プロジェクトの特性に合わせて適切なコマンドを作成し、チーム全体の生産性向上に活用しましょう。

## 参考リソース

- [公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [Claude Command Suite](https://github.com/qdhenry/Claude-Command-Suite) - 119以上のコマンド例
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) - コミュニティ作成のコマンド集