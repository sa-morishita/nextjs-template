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
    "typescript.preferences.root": "Main",
    "biome.lspBin": "Main/node_modules/@biomejs/biome/bin/biome",
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
    
    # ワークツリー名からハッシュ生成（8文字）
    HASH=$(echo -n "$WORKTREE_NAME" | shasum -a 256 | cut -c1-8)
    MINIO_DATA_DIR="../../dev-minio-worktree-${HASH}"
    
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
        
        # sedコマンドで値を置換（macOS/BSD sedとGNU sedの両方に対応）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://localhost:5432/$DB_NAME|" .env.local
            sed -i '' "s|^DEV_MINIO_DATA_DIR=.*|DEV_MINIO_DATA_DIR=$MINIO_DATA_DIR|" .env.local
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://localhost:5432/$DB_NAME|" .env.local
            sed -i "s|^DEV_MINIO_DATA_DIR=.*|DEV_MINIO_DATA_DIR=$MINIO_DATA_DIR|" .env.local
        fi
        
        echo -e "${GREEN}✅ .env.localの環境変数を更新しました${NC}"
        echo -e "${BLUE}  DATABASE_URL: postgresql://localhost:5432/$DB_NAME${NC}"
        echo -e "${BLUE}  DEV_MINIO_DATA_DIR: $MINIO_DATA_DIR${NC}"
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

    # 8. Git hooksのセットアップ
    echo -e "${YELLOW}Git hooksをセットアップしています...${NC}"
    if pnpm run prepare; then
        echo -e "${GREEN}✅ Git hooks（Lefthook）のセットアップが完了しました${NC}"
    else
        echo -e "${RED}⚠️  Git hooksのセットアップに失敗しました${NC}"
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
echo ""
echo -e "${YELLOW}MinIOを起動する場合:${NC}"
echo -e "${YELLOW}  cd $WORKTREE_PATH${NC}"
echo -e "${YELLOW}  source .env.local${NC}"
echo -e "${YELLOW}  minio server \"\$DEV_MINIO_DATA_DIR\" --address \":\$DEV_MINIO_PORT\" --console-address \":\$DEV_MINIO_CONSOLE_PORT\"${NC}"
echo ""
echo -e "${BLUE}現在のworktree一覧:${NC}"
git worktree list