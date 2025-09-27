#!/bin/bash

# Git worktree作成スクリプト
# 使用方法: ./create-worktree.sh <worktree-name> <branch-name>
# 例: ./create-worktree.sh issue-22-home-data-layer feature/issue-22-home-data-layer
# 例: ./create-worktree.sh issue-15-user-auth-fix fix/issue-15-user-auth-fix

set -e

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 引数チェック
if [ $# -lt 2 ]; then
    echo -e "${RED}エラー: worktree名とブランチ名を指定してください${NC}"
    echo "使用方法: $0 <worktree-name> <branch-name>"
    echo ""
    echo "命名規則:"
    echo "  worktree名: <issue番号>-<機能名>"
    echo "  ブランチ名: <prefix>/<issue番号>-<説明>"
    echo ""
    echo "例: $0 issue-22-home-data-layer feature/issue-22-home-data-layer"
    echo "例: $0 issue-15-user-auth-fix fix/issue-15-user-auth-fix"
    echo "例: $0 issue-7-admin-review feature/issue-7-admin-review"
    exit 1
fi

WORKTREE_NAME=$1
BRANCH_NAME=$2

# 現在のディレクトリがGitリポジトリか確認
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}エラー: Gitリポジトリではありません${NC}"
    exit 1
fi

# 現在のブランチがmain、master、またはdevelopであることを確認
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${RED}エラー: このスクリプトはmain、master、またはdevelopブランチから実行してください${NC}"
    echo -e "${YELLOW}現在のブランチ: $CURRENT_BRANCH${NC}"
    exit 1
fi

# プロジェクトルートに移動
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# workディレクトリを作成（既に存在する場合はスキップ）
if [ ! -d "work" ]; then
    echo -e "${BLUE}workディレクトリを作成しています...${NC}"
    mkdir -p work
fi

# worktreeディレクトリのパス
WORKTREE_PATH="work/${WORKTREE_NAME}"

# 既存のworktreeをチェック
if git worktree list | grep -q "$WORKTREE_PATH"; then
    echo -e "${RED}エラー: worktree '$WORKTREE_NAME' は既に存在します${NC}"
    git worktree list
    exit 1
fi

# ディレクトリが既に存在するかチェック
if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}エラー: ディレクトリ '$WORKTREE_PATH' は既に存在します${NC}"
    exit 1
fi

# ブランチの存在確認
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    # 既存のブランチを使用
    echo -e "${YELLOW}既存のブランチ '$BRANCH_NAME' を使用してworktreeを作成します${NC}"

    # ブランチが他のworktreeで使用されていないか確認
    if git worktree list | grep -q "$BRANCH_NAME"; then
        echo -e "${RED}エラー: ブランチ '$BRANCH_NAME' は既に他のworktreeで使用されています${NC}"
        git worktree list
        exit 1
    fi

    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    # 新しいブランチを作成
    echo -e "${YELLOW}新しいブランチ '$BRANCH_NAME' を作成してworktreeを追加します${NC}"

    # ベースブランチを決定（developを優先、次にmainまたはmaster）
    if git show-ref --verify --quiet refs/heads/develop; then
        BASE_BRANCH="develop"
    elif git show-ref --verify --quiet refs/heads/main; then
        BASE_BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        BASE_BRANCH="master"
    else
        BASE_BRANCH=$(git symbolic-ref --short HEAD)
    fi

    echo -e "${YELLOW}ベースブランチ: $BASE_BRANCH${NC}"
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "$BASE_BRANCH"
fi

# VSCode workspaceファイルを更新
update_vscode_workspace() {
    local workspace_file=".document/worktree-workspace.code-workspace"

    # workspaceファイルを再生成
    local temp_file=$(mktemp)

    # 新しいworkspaceファイルを生成
    cat > "$temp_file" << EOF
{
  "folders": [
    {
      "name": "Main",
      "path": ".."
    }
EOF

    # 既存のworktreeを検索してフォルダーエントリを追加
    if [ -d "work" ]; then
        for worktree_dir in work/*/; do
            if [ -d "$worktree_dir" ]; then
                local dir_name=$(basename "$worktree_dir")
                # git worktree listでブランチ名を取得
                local branch_info=$(git worktree list | grep "work/$dir_name" | awk '{print $2}' | sed 's/\[//' | sed 's/\]//')

                if [ -n "$branch_info" ]; then
                    cat >> "$temp_file" << EOF
    ,{
      "name": "$dir_name ($branch_info)",
      "path": "../work/$dir_name"
    }
EOF
                fi
            fi
        done
    fi

    # 設定部分を追加
    cat >> "$temp_file" << EOF
  ],
  "settings": {
    "biome.lsp.bin": "Main/node_modules/@biomejs/biome/bin/biome",
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "biomejs.biome",
    "editor.codeActionsOnSave": {
      "quickfix.biome": "explicit",
      "source.organizeImports.biome": "explicit"
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.next": true,
      "**/supabase/.temp": true
    }
  },
  "extensions": {
    "recommendations": [
      "biomejs.biome",
      "bradlc.vscode-tailwindcss",
      "ms-vscode.vscode-typescript-next",
      "unifiedjs.vscode-mdx",
      "supabase.supabase",
      "drizzle-team.drizzle-vscode"
    ]
  }
}
EOF

    # ファイルを置換
    mv "$temp_file" "$workspace_file"
    echo -e "${BLUE}VSCode workspaceファイルを更新しました${NC}"
}

# worktreeの初期化処理
setup_worktree() {
    echo -e "${BLUE}worktreeの初期化を開始します...${NC}"

    # worktreeディレクトリに移動
    cd "$WORKTREE_PATH"

    # 1. 全ての.env*ファイルのコピー
    echo -e "${YELLOW}環境設定をコピーしています...${NC}"

    # .env*ファイルをすべてコピー
    ENV_FILES_COPIED=0
    for env_file in ../../.env*; do
        if [ -f "$env_file" ]; then
            filename=$(basename "$env_file")
            cp "$env_file" "$filename"
            echo -e "${GREEN}✅ ${filename}をコピーしました${NC}"
            ENV_FILES_COPIED=$((ENV_FILES_COPIED + 1))
        fi
    done

    # .env*ファイルが見つからない場合のフォールバック
    if [ $ENV_FILES_COPIED -eq 0 ]; then
        echo -e "${RED}⚠️  .env*ファイルが見つかりません。手動で設定してください${NC}"
        if [ -f "../../.env.example" ]; then
            cp "../../.env.example" ".env.local"
            echo -e "${YELLOW}📝 .env.exampleをテンプレートとしてコピーしました${NC}"
        fi
    else
        echo -e "${GREEN}✅ ${ENV_FILES_COPIED}個の環境ファイルをコピーしました${NC}"
    fi

    # 2. プロジェクト名を取得
    PROJECT_NAME=$(basename "$PROJECT_ROOT")

    # 3. ワークツリー専用のデータベースを作成
    echo -e "${YELLOW}ワークツリー専用のPostgreSQLデータベースを作成しています...${NC}"

    # データベース名を生成（ハイフンをアンダースコアに変換）
    DB_NAME="${PROJECT_NAME//-/_}_${WORKTREE_NAME//-/_}_dev"

    # PostgreSQLが起動しているか確認
    if command -v psql &> /dev/null; then
        # データベースが既に存在するか確認
        if psql -U $USER -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            echo -e "${YELLOW}データベース '$DB_NAME' は既に存在します${NC}"
        else
            # データベースを作成
            if createdb "$DB_NAME"; then
                echo -e "${GREEN}✅ データベース '$DB_NAME' を作成しました${NC}"
            else
                echo -e "${RED}❌ データベースの作成に失敗しました${NC}"
                echo "   PostgreSQLが起動していることを確認してください:"
                echo "   brew services start postgresql@17"
            fi
        fi
    else
        echo -e "${RED}⚠️  PostgreSQLがインストールされていません${NC}"
        echo "   以下のコマンドでインストールしてください:"
        echo "   brew install postgresql@17"
        echo "   brew services start postgresql@17"
    fi

    # 4. ワークツリー専用のMinIOデータディレクトリを作成
    echo -e "${YELLOW}ワークツリー専用のMinIOストレージを準備しています...${NC}"

    # ワークツリー内にMinIOデータディレクトリを作成
    MINIO_DATA_DIR="./minio-data"

    # MinIOデータディレクトリを作成
    if [ ! -d "$MINIO_DATA_DIR" ]; then
        mkdir -p "$MINIO_DATA_DIR"
        echo -e "${GREEN}✅ MinIOデータディレクトリ '$MINIO_DATA_DIR' を作成しました${NC}"
    else
        echo -e "${YELLOW}MinIOデータディレクトリ '$MINIO_DATA_DIR' は既に存在します${NC}"
    fi

    # 5. .env.localの環境変数を更新
    if [ -f ".env.local" ]; then
        echo -e "${YELLOW}.env.localの環境変数を更新しています...${NC}"

        # ワークツリー名のハッシュから固有のポート番号を生成
        # ベースポート: 9100 (API), 9200 (Console)
        HASH_NUM=$(echo -n "$WORKTREE_NAME" | cksum | cut -d' ' -f1)
        # 100-999の範囲でポートオフセットを生成
        PORT_OFFSET=$((100 + ($HASH_NUM % 900)))
        MINIO_API_PORT=$((9000 + $PORT_OFFSET))
        MINIO_CONSOLE_PORT=$((9100 + $PORT_OFFSET))
        MINIO_PORT=$MINIO_API_PORT

        # Drizzle Studioポート（5000-5999の範囲）
        DRIZZLE_STUDIO_PORT=$((5000 + ($HASH_NUM % 1000)))

        # Next.jsデベロップメントサーバーポート（3001-3999の範囲）
        NEXTJS_PORT=$((3001 + ($HASH_NUM % 999)))

        # dev3000 MCPポート（3600-4599の範囲）
        DEV3000_MCP_PORT=$((3600 + ($HASH_NUM % 1000)))

        # sedコマンドで値を置換（macOS/BSD sedとGNU sedの両方に対応）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://localhost:5432/$DB_NAME|" .env.local
            sed -i '' "s|^MINIO_ENDPOINT=.*|MINIO_ENDPOINT=http://localhost:$MINIO_API_PORT|" .env.local
            sed -i '' "s|^MINIO_PUBLIC_BASE_URL=.*|MINIO_PUBLIC_BASE_URL=http://localhost:$MINIO_API_PORT/app|" .env.local
            sed -i '' "s|^MINIO_PORT=.*|MINIO_PORT=$MINIO_API_PORT|" .env.local
            sed -i '' "s|^MINIO_CONSOLE_PORT=.*|MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT|" .env.local
            sed -i '' "s|^MINIO_DATA_DIR=.*|MINIO_DATA_DIR=$MINIO_DATA_DIR|" .env.local
            sed -i '' "s|^DRIZZLE_STUDIO_PORT=.*|DRIZZLE_STUDIO_PORT=$DRIZZLE_STUDIO_PORT|" .env.local
            sed -i '' "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:$NEXTJS_PORT|" .env.local
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://localhost:5432/$DB_NAME|" .env.local
            sed -i "s|^MINIO_ENDPOINT=.*|MINIO_ENDPOINT=http://localhost:$MINIO_API_PORT|" .env.local
            sed -i "s|^MINIO_PUBLIC_BASE_URL=.*|MINIO_PUBLIC_BASE_URL=http://localhost:$MINIO_API_PORT/app|" .env.local
            sed -i "s|^MINIO_PORT=.*|MINIO_PORT=$MINIO_API_PORT|" .env.local
            sed -i "s|^MINIO_CONSOLE_PORT=.*|MINIO_CONSOLE_PORT=$MINIO_CONSOLE_PORT|" .env.local
            sed -i "s|^MINIO_DATA_DIR=.*|MINIO_DATA_DIR=$MINIO_DATA_DIR|" .env.local
            sed -i "s|^DRIZZLE_STUDIO_PORT=.*|DRIZZLE_STUDIO_PORT=$DRIZZLE_STUDIO_PORT|" .env.local
            sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:$NEXTJS_PORT|" .env.local
        fi

        echo -e "${GREEN}✅ .env.localの環境変数を更新しました${NC}"
        echo -e "${BLUE}  DATABASE_URL: postgresql://localhost:5432/$DB_NAME${NC}"
        echo -e "${BLUE}  MINIO_DATA_DIR: $MINIO_DATA_DIR${NC}"
        echo -e "${BLUE}  MINIO_PORT: $MINIO_API_PORT${NC}"
        echo -e "${BLUE}  MINIO_CONSOLE_PORT: $MINIO_CONSOLE_PORT${NC}"
        echo -e "${BLUE}  DRIZZLE_STUDIO_PORT: $DRIZZLE_STUDIO_PORT${NC}"
        echo -e "${BLUE}  NEXT_PUBLIC_SITE_URL: http://localhost:$NEXTJS_PORT${NC}"
    fi

    # 6. 依存関係のインストール
    echo -e "${YELLOW}依存関係をインストールしています...${NC}"
    if command -v pnpm >/dev/null 2>&1; then
        pnpm install
        echo -e "${GREEN}✅ pnpm installが完了しました${NC}"
    else
        echo -e "${RED}エラー: pnpmが見つかりません${NC}"
        exit 1
    fi

    # 7. データベースマイグレーションの実行
    echo -e "${YELLOW}データベースマイグレーションを実行しています...${NC}"
    if pnpm db:migrate:dev; then
        echo -e "${GREEN}✅ データベースマイグレーションが完了しました${NC}"
    else
        echo -e "${RED}⚠️  データベースマイグレーションに失敗しました${NC}"
        echo "   手動で実行してください: pnpm db:migrate:dev"
    fi

    # 8. next.config.tsのMinIOポート番号を更新
    echo -e "${YELLOW}next.config.tsのMinIOポート番号を更新しています...${NC}"

    # next.config.tsファイルが存在するか確認
    if [ -f "next.config.ts" ]; then
        # 現在のポート設定を確認
        if grep -q "port: '$MINIO_API_PORT'" next.config.ts; then
            echo -e "${YELLOW}⏭️  next.config.tsのMinIOポートは既に更新されています${NC}"
        else
            # MinIOポート番号を更新（macOS/BSD sedとGNU sedの両方に対応）
            # protocol: 'http' と hostname: 'localhost' または '127.0.0.1' の組み合わせのみ対象
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS - localhost用のポート番号を更新
                sed -i '' "/protocol: 'http'/,/hostname: 'localhost'/ s/port: '[0-9]*',/port: '$MINIO_API_PORT',/" next.config.ts
                sed -i '' "/protocol: 'http'/,/hostname: '127\.0\.0\.1'/ s/port: '[0-9]*',/port: '$MINIO_API_PORT',/" next.config.ts
            else
                # Linux - localhost用のポート番号を更新
                sed -i "/protocol: 'http'/,/hostname: 'localhost'/ s/port: '[0-9]*',/port: '$MINIO_API_PORT',/" next.config.ts
                sed -i "/protocol: 'http'/,/hostname: '127\.0\.0\.1'/ s/port: '[0-9]*',/port: '$MINIO_API_PORT',/" next.config.ts
            fi
            echo -e "${GREEN}✅ next.config.tsのMinIOポート番号を $MINIO_API_PORT に更新しました${NC}"
        fi
    else
        echo -e "${RED}⚠️  next.config.tsファイルが見つかりません${NC}"
    fi

    # 9. MinIOを起動
    echo -e "${YELLOW}MinIOを起動しています...${NC}"

    # MinIOコマンドの存在確認
    if ! command -v minio >/dev/null 2>&1; then
        echo -e "${RED}⚠️  MinIOがインストールされていません${NC}"
        echo -e "${YELLOW}   Homebrewでインストール: brew install minio${NC}"
        echo -e "${YELLOW}   手動インストール: https://min.io/download${NC}"
        echo -e "${YELLOW}   MinIOは後で手動で起動してください${NC}"
    else
        # .env.localの環境変数を読み込む
        source .env.local

        # ポートが使用されていないか確認
        if lsof -i :$MINIO_PORT >/dev/null 2>&1; then
            echo -e "${RED}⚠️  ポート $MINIO_PORT は既に使用されています${NC}"
            echo -e "${YELLOW}   MinIOは後で手動で起動してください${NC}"
        else
            # MinIOを起動
            nohup minio server "$MINIO_DATA_DIR" \
                --address ":$MINIO_PORT" \
                --console-address ":$MINIO_CONSOLE_PORT" \
                > minio.log 2>&1 &

            # PIDを保存
            echo $! > .minio.pid
            sleep 3

            # 起動確認
            if kill -0 $(cat .minio.pid) 2>/dev/null; then
                echo -e "${GREEN}✅ MinIOが起動しました${NC}"
                echo -e "${GREEN}   API: http://localhost:$MINIO_PORT${NC}"
                echo -e "${GREEN}   Console: http://localhost:$MINIO_CONSOLE_PORT${NC}"
                echo -e "${GREEN}   ユーザー: minioadmin / minioadmin${NC}"
            else
                echo -e "${RED}❌ MinIOの起動に失敗しました${NC}"
                echo -e "${YELLOW}   ログを確認: cat minio.log${NC}"
                rm -f .minio.pid
            fi
        fi
    fi

    # 10. MinIO共有バケット(app)のプレフィックスを準備
    echo -e "${YELLOW}MinIO共有バケット(app)を確認しています...${NC}"

    # MinIO Clientコマンドの存在確認
    if ! command -v mc >/dev/null 2>&1; then
        echo -e "${RED}⚠️  MinIO Client (mc) がインストールされていません${NC}"
        echo -e "${YELLOW}   Homebrewでインストール: brew install minio-mc${NC}"
        echo -e "${YELLOW}   バケットは手動で作成してください${NC}"
    else
        # MinIOが起動していることを確認
        if [ -f ".minio.pid" ] && kill -0 $(cat .minio.pid) 2>/dev/null; then
            # .env.localから環境変数を読み込む
            source .env.local

            # MinIOエイリアスを設定
            mc alias set worktree-minio http://localhost:$MINIO_PORT minioadmin minioadmin >/dev/null 2>&1

            if mc ls worktree-minio/app >/dev/null 2>&1; then
                echo -e "${YELLOW}  ⏭️  app は既に存在します${NC}"
            else
                if mc mb worktree-minio/app >/dev/null 2>&1; then
                    mc anonymous set public worktree-minio/app >/dev/null 2>&1
                    echo -e "${GREEN}  ✅ app を作成し公開設定を適用しました${NC}"
                else
                    echo -e "${RED}  ❌ app バケットの作成に失敗しました${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  MinIOが起動していないため、バケット作成をスキップします${NC}"
        fi
    fi

    # プロジェクトルートに戻る
    cd "$PROJECT_ROOT"

    echo -e "${BLUE}初期化処理が完了しました${NC}"
}

# workspaceファイルを更新
update_vscode_workspace

# worktreeの初期化を実行
setup_worktree

# 成功メッセージ
echo ""
echo -e "${GREEN}🎉 worktreeが正常に作成され、開発準備が完了しました！${NC}"
echo -e "${GREEN}パス: $WORKTREE_PATH${NC}"
echo -e "${GREEN}ブランチ: $BRANCH_NAME${NC}"
echo -e "${GREEN}worktree名: $WORKTREE_NAME${NC}"
echo ""
echo -e "${BLUE}環境設定:${NC}"
echo -e "${BLUE}  データベース: $DB_NAME${NC}"
echo -e "${BLUE}  MinIOデータ: $MINIO_DATA_DIR${NC}"
    echo -e "${BLUE}  MinIOプレフィックス: prefix-config.ts で定義されたエントリ${NC}"

# ワークツリー内の.env.localから実際のポート番号を取得
if [ -f "$WORKTREE_PATH/.env.local" ]; then
    ACTUAL_MINIO_PORT=$(grep "^MINIO_PORT=" "$WORKTREE_PATH/.env.local" | cut -d'=' -f2)
    ACTUAL_MINIO_CONSOLE_PORT=$(grep "^MINIO_CONSOLE_PORT=" "$WORKTREE_PATH/.env.local" | cut -d'=' -f2)
    ACTUAL_DRIZZLE_PORT=$(grep "^DRIZZLE_STUDIO_PORT=" "$WORKTREE_PATH/.env.local" | cut -d'=' -f2)
    ACTUAL_NEXTJS_PORT=$(grep "^NEXT_PUBLIC_SITE_URL=" "$WORKTREE_PATH/.env.local" | cut -d'=' -f2 | sed 's|http://localhost:||')

    # dev3000 MCPポートを計算（環境変数のハッシュから）
    WORKTREE_HASH=$(echo -n "$WORKTREE_NAME" | cksum | cut -d' ' -f1)
    ACTUAL_DEV3000_MCP_PORT=$((3600 + ($WORKTREE_HASH % 1000)))

    echo ""
    echo -e "${YELLOW}開発サーバー:${NC}"
    echo -e "${YELLOW}  Next.js: http://localhost:$ACTUAL_NEXTJS_PORT${NC}"
    echo -e "${YELLOW}  起動コマンド: cd $WORKTREE_PATH && pnpm dev --port $ACTUAL_NEXTJS_PORT${NC}"

    echo ""
    echo -e "${YELLOW}dev3000 (AI開発ツール):${NC}"
    echo -e "${YELLOW}  起動コマンド: cd $WORKTREE_PATH && dev3000 --port $ACTUAL_NEXTJS_PORT --mcp-port $ACTUAL_DEV3000_MCP_PORT${NC}"

    echo ""
    echo -e "${YELLOW}MinIO:${NC}"

    # MinIOの状態を確認
    if [ -f "$WORKTREE_PATH/.minio.pid" ] && kill -0 $(cat "$WORKTREE_PATH/.minio.pid") 2>/dev/null; then
        echo -e "${YELLOW}  ステータス: 起動済み${NC}"
        echo -e "${YELLOW}  API: http://localhost:$ACTUAL_MINIO_PORT${NC}"
        echo -e "${YELLOW}  Console: http://localhost:$ACTUAL_MINIO_CONSOLE_PORT${NC}"
    else
        echo -e "${YELLOW}  ステータス: 未起動${NC}"
        echo -e "${YELLOW}  起動コマンド: cd $WORKTREE_PATH && source .env.local && minio server \"\$MINIO_DATA_DIR\" --address \":\$MINIO_PORT\" --console-address \":\$MINIO_CONSOLE_PORT\"${NC}"
    fi

    echo ""
    echo -e "${YELLOW}Drizzle Studio:${NC}"
    echo -e "${YELLOW}  ポート: $ACTUAL_DRIZZLE_PORT${NC}"
    echo -e "${YELLOW}  起動コマンド: cd $WORKTREE_PATH && pnpm db:studio${NC}"
fi
echo ""
echo -e "${BLUE}現在のworktree一覧:${NC}"
git worktree list
