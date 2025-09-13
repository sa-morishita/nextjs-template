仕様書管理システムの初期設定

---
description: "仕様書ディレクトリ構造の作成と初期仕様書生成"
allowed-tools: ["Bash", "Write", "Read", "mcp__serena__check_onboarding_performed", "mcp__serena__onboarding", "mcp__serena__list_memories", "mcp__serena__read_memory", "mcp__serena__find_symbol", "mcp__serena__list_dir"]
---

# init

仕様書管理システムを初期化し、プロジェクトの現状から初期仕様書を生成します。

## Instructions

1. **Serenaの初期化**
   - mcp__serena__check_onboarding_performed でオンボーディング状態を確認
   - 未実行の場合は mcp__serena__onboarding を実行
   - mcp__serena__list_memories で既存メモリを確認

2. **プロジェクト理解の更新**
   - プロジェクト構造の分析と理解
   - mcp__serena__write_memory でプロジェクト現状をメモリに記録

3. **.document/specs/ ディレクトリ構造を作成**
   ```
   .document/specs/
   ├── overview.md      # 概要とインデックス
   └── features/        # 機能別仕様書
   ```

   - src/lib/actions/ のファイルを解析して機能名を抽出
   - src/app/ のルート構造から画面構成を把握
   - 各actionファイルの内容を分析して機能の詳細を理解

   - actions/*.ts のファイル名から機能名を決定（例: auth.ts → auth.md）
   - 各機能の実装内容を分析してテンプレートを作成
   - app/ルート構造と対応させて画面仕様も含める

   - プロジェクト概要
   - 機能一覧とリンク
   - 最終更新日時（ISO 8601形式）を記録

7. **初期化完了メッセージを表示**
   - 作成されたファイル一覧
   - 次のステップ（/docs:sync の使い方）