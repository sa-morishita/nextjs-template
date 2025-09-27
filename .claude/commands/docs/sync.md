Serenaのプロジェクト理解を最新状態に同期

---
description: "プロジェクトの変更を検出し、Serenaのメモリを更新"
allowed-tools: ["Bash", "mcp__serena__list_memories", "mcp__serena__read_memory", "mcp__serena__write_memory", "mcp__serena__find_symbol", "mcp__serena__search_for_pattern", "mcp__serena__list_dir"]
---

# sync

最新のプロジェクト変更を検出し、Serenaのメモリと理解を更新します。

## Instructions

1. **既存メモリの確認**
   - mcp__serena__list_memories で既存メモリを確認
   - プロジェクト関連メモリがあれば読み込み、最終更新時点を把握
   - メモリがない場合は /docs:init の実行を促す

2. **最近の変更を検出**
   ```bash
   git log --since="1 week ago" --name-only --pretty=format:"%h %s" | grep -E "^src/"
   ```
   - メモリに記録された最終更新日時があればそれを使用
   - なければ直近1週間の変更を確認

3. **変更されたファイルの分析**
   - src/lib/actions/ の変更：新機能の追加や既存機能の修正を検出
   - src/db/schema/ の変更：データモデルの変更を検出
   - src/app/ の変更：ルーティング構造やページの変更を検出
   - src/components/ の変更：UIコンポーネントの追加・変更を検出

4. **シンボル変更の詳細分析**
   - mcp__serena__find_symbol で変更されたファイルのシンボルを取得
   - 新規追加されたシンボル（関数、クラス、定数）を識別
   - 削除されたシンボルを検出
   - シンボルのシグネチャ変更を確認

5. **プロジェクト構造の再スキャン**
   - mcp__serena__list_dir で現在のディレクトリ構造を確認
   - 新規ディレクトリやファイルの追加を検出
   - アーキテクチャパターンの変化を分析

6. **メモリの更新**
   - mcp__serena__write_memory で以下を更新:
     - 検出された変更のサマリー
     - 新規・変更されたシンボル情報
     - 更新されたプロジェクト構造
     - アーキテクチャやパターンの変化
     - 最終同期日時

7. **同期完了レポート**
   - 検出された主な変更点
   - 更新されたメモリの概要
   - プロジェクトの現在の状態サマリー