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

# プロジェクトのフルパスとワークツリー名からハッシュ生成（8文字）
# フルパスを使用することで、同名プロジェクトでも異なるハッシュを生成
IDENTIFIER="${PROJECT_PATH}-${WORKTREE_NAME}"
HASH=$(echo -n "$IDENTIFIER" | shasum -a 256 | cut -c1-8)

# PostgreSQL設定
DB_NAME="${PROJECT_NAME//-/_}_${WORKTREE_NAME//-/_}_dev"  # ハイフンをアンダースコアに変換

# MinIO設定（ハッシュから数値を生成してポート番号に使用）
# より多くのハッシュ文字を使用し、ポート範囲を拡大
PORT_OFFSET=$((0x${HASH:0:6} % 10000))  # 0-9999の範囲
MINIO_PORT=$((10000 + PORT_OFFSET))  # 10000-19999の範囲
MINIO_CONSOLE_PORT=$((20000 + PORT_OFFSET))  # 20000-29999の範囲
MINIO_DATA_DIR="./dev-minio-${HASH}"

# Drizzle Studio設定（ハッシュベースでポート番号を生成）
# 30000-39999の範囲で、他のサービスと衝突しない範囲を使用
DRIZZLE_STUDIO_PORT=$((30000 + PORT_OFFSET))

echo "🆔 プロジェクト識別子: $IDENTIFIER"
echo "🔢 ハッシュ: $HASH"
echo "🐘 PostgreSQL DB名: $DB_NAME"
echo "🗄️  MinIO API ポート: $MINIO_PORT"
echo "🌐 MinIO Console ポート: $MINIO_CONSOLE_PORT"
echo "📦 MinIO データディレクトリ: $MINIO_DATA_DIR"
echo "🎨 Drizzle Studio ポート: $DRIZZLE_STUDIO_PORT"

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
            
            # .env.localの場合は開発環境用の値を置換
            if [ "$env_file" = ".env.local" ]; then
                # sedコマンドで値を置換（macOS/BSD sedとGNU sedの両方に対応）
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    sed -i '' "s|^NEXT_PUBLIC_SITE_URL=$|NEXT_PUBLIC_SITE_URL=http://localhost:3000|" "$env_file"
                    sed -i '' "s|^NEXT_PUBLIC_SUPABASE_URL=$|NEXT_PUBLIC_SUPABASE_URL=http://localhost:$MINIO_PORT|" "$env_file"
                    sed -i '' "s|^SUPABASE_SERVICE_ROLE_KEY=$|SUPABASE_SERVICE_ROLE_KEY=minioadmin|" "$env_file"
                    sed -i '' "s|^DATABASE_URL=$|DATABASE_URL=postgresql://localhost:5432/$DB_NAME|" "$env_file"
                    sed -i '' "s|^DEV_MINIO_PORT=$|DEV_MINIO_PORT=$MINIO_PORT|" "$env_file"
                    sed -i '' "s|^DEV_MINIO_CONSOLE_PORT=$|DEV_MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT|" "$env_file"
                    sed -i '' "s|^DEV_MINIO_DATA_DIR=$|DEV_MINIO_DATA_DIR=$MINIO_DATA_DIR|" "$env_file"
                    sed -i '' "s|^DRIZZLE_STUDIO_PORT=$|DRIZZLE_STUDIO_PORT=$DRIZZLE_STUDIO_PORT|" "$env_file"
                else
                    # Linux
                    sed -i "s|^NEXT_PUBLIC_SITE_URL=$|NEXT_PUBLIC_SITE_URL=http://localhost:3000|" "$env_file"
                    sed -i "s|^NEXT_PUBLIC_SUPABASE_URL=$|NEXT_PUBLIC_SUPABASE_URL=http://localhost:$MINIO_PORT|" "$env_file"
                    sed -i "s|^SUPABASE_SERVICE_ROLE_KEY=$|SUPABASE_SERVICE_ROLE_KEY=minioadmin|" "$env_file"
                    sed -i "s|^DATABASE_URL=$|DATABASE_URL=postgresql://localhost:5432/$DB_NAME|" "$env_file"
                    sed -i "s|^DEV_MINIO_PORT=$|DEV_MINIO_PORT=$MINIO_PORT|" "$env_file"
                    sed -i "s|^DEV_MINIO_CONSOLE_PORT=$|DEV_MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT|" "$env_file"
                    sed -i "s|^DEV_MINIO_DATA_DIR=$|DEV_MINIO_DATA_DIR=$MINIO_DATA_DIR|" "$env_file"
                    sed -i "s|^DRIZZLE_STUDIO_PORT=$|DRIZZLE_STUDIO_PORT=$DRIZZLE_STUDIO_PORT|" "$env_file"
                fi
                echo "🔧 開発環境用の設定値を $env_file に適用しました"
            fi
            
            # .env.test.localの場合は開発環境と同じMinIOポートのみ設定
            if [ "$env_file" = ".env.test.local" ]; then
                # sedコマンドで値を置換（macOS/BSD sedとGNU sedの両方に対応）
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    sed -i '' "s|^NEXT_PUBLIC_SUPABASE_URL=$|NEXT_PUBLIC_SUPABASE_URL=http://localhost:$MINIO_PORT|" "$env_file"
                else
                    # Linux
                    sed -i "s|^NEXT_PUBLIC_SUPABASE_URL=$|NEXT_PUBLIC_SUPABASE_URL=http://localhost:$MINIO_PORT|" "$env_file"
                fi
                echo "🔧 テスト環境用のMinIOポートを $env_file に設定しました: $MINIO_PORT"
            fi
        fi
    fi
done

# 4. PostgreSQLデータベースの作成
echo ""
echo "🐘 PostgreSQLデータベースを作成しています..."

# PostgreSQLが起動しているか確認
if command -v psql &> /dev/null; then
    # データベースが既に存在するか確認
    if psql -U $USER -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "⏭️  データベース '$DB_NAME' は既に存在するため、スキップします"
    else
        # データベースを作成
        createdb "$DB_NAME"
        if [ $? -eq 0 ]; then
            echo "✅ データベース '$DB_NAME' を作成しました"
        else
            echo "❌ データベースの作成に失敗しました"
            echo "   PostgreSQLが起動していることを確認してください:"
            echo "   brew services start postgresql@17"
        fi
    fi
else
    echo "⚠️  PostgreSQLがインストールされていません"
    echo "   以下のコマンドでインストールしてください:"
    echo "   brew install postgresql@17"
    echo "   brew services start postgresql@17"
fi

# 5. Serena MCP を追加
echo ""
echo "📦 Serena MCP を追加しています..."
claude mcp add serena -- /opt/homebrew/bin/uvx --from git+https://github.com/oraios/serena serena start-mcp-server --enable-web-dashboard false --context ide-assistant --project "$PROJECT_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Serena MCP の追加に成功しました"
else
    echo "❌ Serena MCP の追加に失敗しました"
    exit 1
fi

# 6. Sentry MCP を追加
echo ""
echo "📦 Sentry MCP を追加しています..."
claude mcp add --transport http sentry -s project https://mcp.sentry.dev/mcp

if [ $? -eq 0 ]; then
    echo "✅ Sentry MCP の追加に成功しました"
else
    echo "❌ Sentry MCP の追加に失敗しました"
    exit 1
fi

# 7. Brave Search MCP を追加（.env.mcp.localからAPIキーを読み込み）
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

# 8. Context7 MCP を追加
echo ""
echo "📦 Context7 MCP を追加しています..."
claude mcp add --transport http context7 -s project https://mcp.context7.com/mcp

if [ $? -eq 0 ]; then
    echo "✅ Context7 MCP の追加に成功しました"
else
    echo "❌ Context7 MCP の追加に失敗しました"
    exit 1
fi

# 9. Playwright MCP を追加
echo ""
echo "📦 Playwright MCP を追加しています..."
claude mcp add playwright -s project -- npx -y @playwright/mcp@latest

if [ $? -eq 0 ]; then
    echo "✅ Playwright MCP の追加に成功しました"
else
    echo "❌ Playwright MCP の追加に失敗しました"
    exit 1
fi

# 10. AI統合 (dev3000 MCP) を追加
echo ""
echo "📦 dev3000 MCP を追加しています..."
claude mcp add --transport http --scope user dev3000 http://localhost:3684/api/mcp/mcp

if [ $? -eq 0 ]; then
    echo "✅ dev3000 MCP の追加に成功しました"
else
    echo "❌ dev3000 MCP の追加に失敗しました"
    echo "   ローカルサーバーが起動していることを確認してください"
fi

# 11. .gitignoreにMinIOデータディレクトリを追加
echo ""
echo "🔧 .gitignoreにMinIOデータディレクトリを追加しています..."

# .gitignoreファイルが存在するか確認
if [ -f ".gitignore" ]; then
    # dev-minio-*パターンが既に存在するか確認
    if grep -q "^dev-minio-\*" .gitignore || grep -q "^/dev-minio-\*" .gitignore; then
        echo "⏭️  dev-minio-* は既に.gitignoreに含まれています"
    else
        # MinIOデータディレクトリのパターンを追加
        echo "" >> .gitignore
        echo "# MinIO local development storage" >> .gitignore
        echo "dev-minio-*/" >> .gitignore
        echo ".minio.pid" >> .gitignore
        echo "✅ dev-minio-*/ と .minio.pid を.gitignoreに追加しました"
    fi
else
    echo "⚠️  .gitignoreファイルが見つかりません"
fi

# 12. package.jsonのdb:studioコマンドを更新
echo ""
echo "🔧 package.jsonのdb:studioコマンドを更新しています..."

# package.jsonファイルが存在するか確認
if [ -f "package.json" ]; then
    # 既にdrizzle-kit studio --portが含まれているか確認
    if grep -q '"db:studio".*drizzle-kit studio --port' package.json; then
        echo "⏭️  db:studioコマンドは既に更新されています"
    else
        # db:studioコマンドを更新（macOS/BSD sedとGNU sedの両方に対応）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' 's/"db:studio": ".*"/"db:studio": "source .env.local \&\& drizzle-kit studio --port \$DRIZZLE_STUDIO_PORT"/' package.json
        else
            # Linux
            sed -i 's/"db:studio": ".*"/"db:studio": "source .env.local \&\& drizzle-kit studio --port \$DRIZZLE_STUDIO_PORT"/' package.json
        fi
        echo "✅ db:studioコマンドを更新しました"
    fi
else
    echo "⚠️  package.jsonファイルが見つかりません"
fi

# 13. 完了メッセージ
echo ""
echo "🎉 セットアップが完了しました！"
echo ""
echo "📋 生成された設定:"
echo "   🆔 プロジェクト識別子: $IDENTIFIER"
echo "   🐘 PostgreSQL DB: $DB_NAME"
echo "   🗄️  MinIO API: http://localhost:$MINIO_PORT"
echo "   🌐 MinIO Console: http://localhost:$MINIO_CONSOLE_PORT"
echo "   🎨 Drizzle Studio: http://localhost:$DRIZZLE_STUDIO_PORT"
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
