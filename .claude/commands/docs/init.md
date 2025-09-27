Serenaの初期設定

---

description: "Serenaのオンボーディングとプロジェクト理解の初期化"
allowed-tools: ["mcp__serena__check_onboarding_performed", "mcp__serena__onboarding", "mcp__serena__list_memories", "mcp__serena__write_memory", "mcp__serena__list_dir", "mcp__serena__find_symbol"]

---

# init

Serenaを初期化し、プロジェクトの構造を理解してメモリに記録します。

## Instructions

1. **Serenaのオンボーディング確認**
   - mcp**serena**check_onboarding_performed でオンボーディング状態を確認
   - 未実行の場合は mcp**serena**onboarding を実行
   - mcp**serena**list_memories で既存メモリを確認

2. **プロジェクト構造の分析**
   - mcp**serena**list_dir でプロジェクト全体の構造を把握
   - 主要なディレクトリとファイルの配置を理解
   - src/lib/actions/, src/app/, src/db/schema/ などの重要ディレクトリを特定

3. **コードシンボルの収集**
   - mcp**serena**find_symbol で主要なクラス、関数、定数を収集
   - アプリケーションのエントリーポイントと主要コンポーネントを識別
   - ルーティング構造とAPI構造を理解

4. **プロジェクト理解をメモリに記録**
   - mcp**serena**write_memory で以下の情報を記録:
     - プロジェクト概要と技術スタック
     - ディレクトリ構造と命名規則
     - 主要な機能とモジュール構成
     - 検出したシンボルとその役割
     - アーキテクチャパターンと設計指針

5. **初期化完了レポート**
   - Serenaの初期化状態
   - 記録されたメモリの概要
   - 次のステップ（/docs:sync の使い方）
