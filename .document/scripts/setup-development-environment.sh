#!/bin/bash

# Claude Code用の開発環境セットアップスクリプト
# このスクリプトはMCPの追加など、プロジェクト開始時に必要な設定を行います

set -e  # エラーが発生したら停止

echo "🚀 開発環境のセットアップを開始します..."

# 1. 現在のプロジェクトパスを取得
PROJECT_PATH="$(pwd)"
echo "📁 プロジェクトパス: $PROJECT_PATH"

# 2. プロジェクト固有ID生成
echo ""
echo "🔧 プロジェクト固有の設定を生成しています..."

# プロジェクト名とワークツリー情報からユニークIDを生成
PROJECT_NAME=$(basename "$PROJECT_PATH")
if [ -f ".git/HEAD" ]; then
    # 通常のgitリポジトリ
    WORKTREE_NAME="main"
elif [ -f ".git" ] && grep -q "gitdir:" ".git"; then
    # worktree の場合
    WORKTREE_NAME=$(basename "$PROJECT_PATH")
else
    # gitリポジトリでない場合
    WORKTREE_NAME="standalone"
fi

# プロジェクト名とワークツリー名からハッシュ生成（8文字）
IDENTIFIER="${PROJECT_NAME}-${WORKTREE_NAME}"
HASH=$(echo -n "$IDENTIFIER" | shasum -a 256 | cut -c1-8)

# PGLite設定
PGLITE_DB_PATH="./dev-db-${HASH}.db"

# MinIO設定（ハッシュから4桁の数値を生成してポート番号に使用）
PORT_OFFSET=$((0x${HASH:0:4} % 1000))  # 0-999の範囲
MINIO_PORT=$((9000 + PORT_OFFSET))
MINIO_CONSOLE_PORT=$((9001 + PORT_OFFSET))
MINIO_DATA_DIR="./dev-minio-${HASH}"

echo "🆔 プロジェクト識別子: $IDENTIFIER"
echo "🔢 ハッシュ: $HASH"
echo "📁 PGLite DB: $PGLITE_DB_PATH"
echo "🗄️  MinIO API ポート: $MINIO_PORT"
echo "🌐 MinIO Console ポート: $MINIO_CONSOLE_PORT"
echo "📦 MinIO データディレクトリ: $MINIO_DATA_DIR"

# 3. 環境変数ファイルのセットアップ
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
            
            # .env.localの場合は追加設定を挿入
            if [ "$env_file" = ".env.local" ]; then
                echo "" >> "$env_file"
                echo "# PGLite & MinIO 設定（自動生成）" >> "$env_file"
                echo "# プロジェクト識別子: $IDENTIFIER" >> "$env_file"
                echo "DATABASE_URL=\"pglite://$PGLITE_DB_PATH\"" >> "$env_file"
                echo "NEXT_PUBLIC_SUPABASE_URL=\"http://localhost:$MINIO_PORT\"" >> "$env_file"
                echo "DEV_MINIO_PORT=$MINIO_PORT" >> "$env_file"
                echo "DEV_MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT" >> "$env_file"
                echo "DEV_MINIO_DATA_DIR=\"$MINIO_DATA_DIR\"" >> "$env_file"
                echo "🔧 PGLite & MinIO設定を $env_file に追加しました"
            fi
        fi
    fi
done

# 4. Serena MCP を追加
echo ""
echo "📦 Serena MCP を追加しています..."
claude mcp add serena -- /opt/homebrew/bin/uvx --from git+https://github.com/oraios/serena serena start-mcp-server --enable-web-dashboard false --context ide-assistant --project "$PROJECT_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Serena MCP の追加に成功しました"
else
    echo "❌ Serena MCP の追加に失敗しました"
    exit 1
fi

# 5. Sentry MCP を追加
echo ""
echo "📦 Sentry MCP を追加しています..."
claude mcp add --transport http sentry -s project https://mcp.sentry.dev/mcp

if [ $? -eq 0 ]; then
    echo "✅ Sentry MCP の追加に成功しました"
else
    echo "❌ Sentry MCP の追加に失敗しました"
    exit 1
fi

# 6. Brave Search MCP を追加（.env.mcp.localからAPIキーを読み込み）
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

# 7. Context7 MCP を追加
echo ""
echo "📦 Context7 MCP を追加しています..."
claude mcp add --transport http context7 -s project https://mcp.context7.com/mcp

if [ $? -eq 0 ]; then
    echo "✅ Context7 MCP の追加に成功しました"
else
    echo "❌ Context7 MCP の追加に失敗しました"
    exit 1
fi

# 8. Playwright MCP を追加
echo ""
echo "📦 Playwright MCP を追加しています..."
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest

if [ $? -eq 0 ]; then
    echo "✅ Playwright MCP の追加に成功しました"
else
    echo "❌ Playwright MCP の追加に失敗しました"
    exit 1
fi

# 9. AI統合 (dev3000 MCP) を追加
echo ""
echo "📦 dev3000 MCP を追加しています..."
claude mcp add --transport http --scope user dev3000 http://localhost:3684/api/mcp/mcp

if [ $? -eq 0 ]; then
    echo "✅ dev3000 MCP の追加に成功しました"
else
    echo "❌ dev3000 MCP の追加に失敗しました"
    echo "   ローカルサーバーが起動していることを確認してください"
fi

# 10. 完了メッセージ
echo ""
echo "🎉 セットアップが完了しました！"
echo ""
echo "📋 生成された設定:"
echo "   🆔 プロジェクト識別子: $IDENTIFIER"
echo "   📁 PGLite DB: $PGLITE_DB_PATH"
echo "   🗄️  MinIO API: http://localhost:$MINIO_PORT"
echo "   🌐 MinIO Console: http://localhost:$MINIO_CONSOLE_PORT"
echo ""
echo "⚠️  重要な注意事項:"
echo "   1. 次回 Claude Code 起動時に Sentry の認証を求められます。"
echo "      画面の指示に従って認証を完了してください。"
echo "   2. MinIOを起動するには以下のコマンドを実行してください："
echo "      minio server \"$MINIO_DATA_DIR\" --address \":$MINIO_PORT\" --console-address \":$MINIO_CONSOLE_PORT\""
echo "   3. Brave Search MCPを使用するには、.env.mcp.localにBRAVE_API_KEYを設定してください。"
echo "   4. Playwright MCPを使用してブラウザ自動化やE2Eテストの実行ができます。"
echo "   5. dev3000 MCPを使用するには、ローカルサーバー (http://localhost:3684) が起動している必要があります。"
echo ""

# 今後追加される可能性のある設定項目のためのスペース
# 例：
# - 追加のMCP設定
# - 環境変数の設定
# - 依存関係のインストール
# - その他の初期設定
