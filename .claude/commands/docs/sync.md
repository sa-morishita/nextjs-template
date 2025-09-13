最後の更新以降の変更を検出して仕様書を更新

---
description: "前回更新からの差分を検出し、仕様書を最新化"
allowed-tools: ["Bash", "Read", "MultiEdit", "mcp__serena__write_memory", "mcp__serena__find_symbol", "mcp__serena__search_for_pattern"]
---

# sync

前回の仕様書更新以降の変更を自動検出し、関連する仕様書を更新します。

## Instructions

1. **Serenaメモリの確認と更新**
   - mcp__serena__list_memories で既存メモリを確認
   - プロジェクト関連メモリを読み込んで現状を理解

2. **.document/specs/overview.md から最終更新日時を取得**
   - ファイルが存在しない場合は /docs:init の実行を促す
   - 日時は ISO 8601 形式で記録されている
   - 現在の仕様書構造も同時に把握

   ```bash
   git log --since="<最終更新日時>" --name-only --pretty=format:"%h %s" | grep -E "^src/"
   ```

   - src/lib/actions/内のファイルをベース名でグルーピング（*.ts → *.md）
   - src/db/schema/変更は関連する機能の仕様書に影響
   - src/app/のルート変更は対応する機能の仕様書に反映
   - 新規機能の検出時は新しい仕様書を作成
   - 機能の削除時は対応する仕様書を削除またはアーカイブ
   - 既存の.document/specs/features/内のファイルと比較して差分を把揥

   - 変更内容を分析（新規関数、パラメータ変更、削除など）
   - 非エンジニアにも分かりやすい説明を追加
   - 変更日時と変更内容を記録
   - 機能名の変更時は仕様書ファイル名も更新
   - 仕様書の統合や分割が必要な場合は適切に対応

   - 最終更新日時を現在時刻に更新
   - 「最近の更新」セクションに今回の変更サマリーを追加
   - 機能一覧とリンクも現在の構造に合わせて更新

   - mcp__serena__write_memory で変更内容をメモリーに記録
   - プロジェクト全体の理解を最新化

8. **更新完了レポートを表示**
   - 更新された仕様書の一覧
   - 検出された主な変更点
   - 次回の sync 推奨タイミング