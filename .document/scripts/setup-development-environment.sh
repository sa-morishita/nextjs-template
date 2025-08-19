#!/bin/bash

# Claude Code用の開発環境セットアップスクリプト
# このスクリプトはMCPの追加など、プロジェクト開始時に必要な設定を行います

set -e  # エラーが発生したら停止

echo "🚀 開発環境のセットアップを開始します..."

# 1. 現在のプロジェクトパスを取得
PROJECT_PATH="$(pwd)"
echo "📁 プロジェクトパス: $PROJECT_PATH"

# 2. 環境変数ファイルのセットアップ
echo ""
echo "🔧 環境変数ファイルをセットアップしています..."

# .env.*.example ファイルをコピー（既存のファイルはスキップ）
for example_file in .env*.example; do
    if [ -f "$example_file" ]; then
        # .example を除いたファイル名を取得
        env_file="${example_file%.example}"

        # 既にファイルが存在する場合はスキップ
        if [ -f "$env_file" ]; then
            echo "⏭️  $env_file は既に存在するため、スキップします"
        else
            cp "$example_file" "$env_file"
            echo "✅ $example_file → $env_file をコピーしました"
        fi
    fi
done

# 3. Serena MCP を追加
echo ""
echo "📦 Serena MCP を追加しています..."
claude mcp add serena -- /opt/homebrew/bin/uvx --from git+https://github.com/oraios/serena serena start-mcp-server --enable-web-dashboard false --context ide-assistant --project "$PROJECT_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Serena MCP の追加に成功しました"
else
    echo "❌ Serena MCP の追加に失敗しました"
    exit 1
fi

# 4. Sentry MCP を追加
echo ""
echo "📦 Sentry MCP を追加しています..."
claude mcp add --transport http sentry -s project https://mcp.sentry.dev/mcp

if [ $? -eq 0 ]; then
    echo "✅ Sentry MCP の追加に成功しました"
else
    echo "❌ Sentry MCP の追加に失敗しました"
    exit 1
fi

# 5. Brave Search MCP を追加（.env.mcp.localからAPIキーを読み込み）
echo ""
echo "📦 Brave Search MCP を追加しています..."

# .env.mcp.localファイルが存在するかチェック
if [ -f ".env.mcp.local" ]; then
    # .env.mcp.localからBRAVE_API_KEYを読み込む
    BRAVE_API_KEY=$(grep "^BRAVE_API_KEY=" .env.mcp.local | cut -d '=' -f2- | tr -d '"')

    if [ -n "$BRAVE_API_KEY" ]; then
        echo "🔑 .env.mcp.localからBRAVE_API_KEYを読み込みました"
        claude mcp add brave-search -s project -e BRAVE_API_KEY="$BRAVE_API_KEY" -- npx -y @modelcontextprotocol/server-brave-search

        if [ $? -eq 0 ]; then
            echo "✅ Brave Search MCP の追加に成功しました"
        else
            echo "❌ Brave Search MCP の追加に失敗しました"
            exit 1
        fi
    else
        echo "⚠️  BRAVE_API_KEYが.env.mcp.localに設定されていません"
        echo "   .env.mcp.localに以下の行を追加してください："
        echo "   BRAVE_API_KEY=your_brave_api_key_here"
        echo "   スキップして続行します..."
    fi
else
    echo "⚠️  .env.mcp.localファイルが見つかりません"
    echo "   Brave Search MCPの追加をスキップします"
    echo "   .env.mcp.localを作成し、BRAVE_API_KEYを設定後、再度実行してください"
fi

# 6. Context7 MCP を追加
echo ""
echo "📦 Context7 MCP を追加しています..."
claude mcp add --transport http context7 -s project https://mcp.context7.com/mcp

if [ $? -eq 0 ]; then
    echo "✅ Context7 MCP の追加に成功しました"
else
    echo "❌ Context7 MCP の追加に失敗しました"
    exit 1
fi

# 7. GitMCP を追加（テンプレートリポジトリを参照）
echo ""
echo "📦 GitMCP を追加しています（テンプレートリポジトリ参照用）..."
claude mcp add git-mcp-template -s project -- npx -y mcp-remote https://gitmcp.io/sa-morishita/nextjs-template

if [ $? -eq 0 ]; then
    echo "✅ GitMCP の追加に成功しました"
    echo "   参照リポジトリ: https://github.com/sa-morishita/nextjs-template"
else
    echo "❌ GitMCP の追加に失敗しました"
    exit 1
fi

# 8. 完了メッセージ
echo ""
echo "🎉 セットアップが完了しました！"
echo ""
echo "⚠️  重要な注意事項:"
echo "   1. 次回 Claude Code 起動時に Sentry の認証を求められます。"
echo "      画面の指示に従って認証を完了してください。"
echo "   2. Brave Search MCPを使用するには、.env.mcp.localにBRAVE_API_KEYを設定してください。"
echo "   3. GitMCP経由でテンプレートリポジトリ（sa-morishita/nextjs-template）を参照できます。"
echo "      コード品質の基準として活用してください。"
echo ""

# 今後追加される可能性のある設定項目のためのスペース
# 例：
# - 追加のMCP設定
# - 環境変数の設定
# - 依存関係のインストール
# - その他の初期設定
