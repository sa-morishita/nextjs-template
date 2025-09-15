#!/bin/bash

# Git worktree削除スクリプト
# 使用方法: ./delete-worktree.sh <worktree-name>

set -e

# カラー定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 引数チェック
if [ $# -lt 1 ]; then
    echo -e "${RED}エラー: worktree名を指定してください${NC}"
    echo "使用方法: $0 <worktree-name>"
    echo "例: $0 login"
    echo "例: $0 hotfix"
    echo ""
    echo "現在のworktree一覧:"
    git worktree list
    exit 1
fi

WORKTREE_NAME=$1

# 現在のディレクトリがGitリポジトリか確認
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}エラー: Gitリポジトリではありません${NC}"
    exit 1
fi

# プロジェクトルートに移動
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# worktreeディレクトリのパスを検索（完全一致または前方一致）
WORKTREE_PATH=""
WORKTREE_FULL_PATH=""

# まず完全一致を試す
if git worktree list | grep -q "work/${WORKTREE_NAME}[[:space:]]"; then
    WORKTREE_PATH="work/${WORKTREE_NAME}"
elif git worktree list | grep -q "work/${WORKTREE_NAME}-"; then
    # 前方一致で検索
    WORKTREE_PATH=$(git worktree list | grep -o "work/${WORKTREE_NAME}-[^[:space:]]*" | head -1)
fi

# worktreeの存在確認
if [ -z "$WORKTREE_PATH" ]; then
    echo -e "${RED}エラー: worktree '$WORKTREE_NAME' が見つかりません${NC}"
    echo ""
    echo "現在のworktree一覧:"
    git worktree list
    exit 1
fi

# 完全なパスを取得
WORKTREE_FULL_PATH="$PROJECT_ROOT/$WORKTREE_PATH"

# 現在のディレクトリがこのworktree内かチェック
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == "$WORKTREE_FULL_PATH"* ]]; then
    echo -e "${RED}エラー: 削除しようとしているworktree内から実行することはできません${NC}"
    echo "メインのworktreeまたは別のディレクトリに移動してから実行してください"
    exit 1
fi

# worktreeの情報を取得
WORKTREE_INFO=$(git worktree list | grep "$WORKTREE_PATH")
echo -e "${BLUE}削除対象のworktree情報:${NC}"
echo "$WORKTREE_INFO"

# 削除前にブランチ名を取得（スペースを含むパスに対応）
BRANCH_NAME=$(echo "$WORKTREE_INFO" | grep -o '\[.*\]' | sed 's/\[//' | sed 's/\]//')

# プロジェクト名を取得
PROJECT_NAME=$(basename "$PROJECT_ROOT")

# データベース名を取得（ワークツリー名から生成）
ACTUAL_WORKTREE_NAME=$(basename "$WORKTREE_PATH")
DB_NAME="${PROJECT_NAME//-/_}_${ACTUAL_WORKTREE_NAME//-/_}_dev"


# 確認プロンプト
echo ""
echo -e "${YELLOW}⚠️  警告: この操作は取り消せません${NC}"
echo -e "${YELLOW}以下を削除します:${NC}"
echo -e "${YELLOW}  - worktree: $WORKTREE_PATH${NC}"
echo -e "${YELLOW}  - ブランチ: $BRANCH_NAME${NC}"
echo -e "${YELLOW}  - データベース: $DB_NAME${NC}"
echo ""
echo -n "削除する場合は 'yes' と入力してください: "
read -r CONFIRMATION

if [ "$CONFIRMATION" != "yes" ]; then
    echo -e "${YELLOW}削除をキャンセルしました${NC}"
    exit 0
fi


# MinIOプロセスの停止
echo -e "${YELLOW}MinIOプロセスを確認しています...${NC}"

# PIDファイルを確認してMinIOを停止
if [ -f "$WORKTREE_FULL_PATH/.minio.pid" ]; then
    PID=$(cat "$WORKTREE_FULL_PATH/.minio.pid")
    if kill -0 $PID 2>/dev/null; then
        echo -e "${YELLOW}MinIOを停止しています...${NC}"
        kill $PID
        sleep 2
        
        # 強制終了が必要な場合
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID
        fi
        
        echo -e "${GREEN}✅ MinIOを停止しました${NC}"
    else
        echo -e "${YELLOW}MinIOプロセスが見つかりません（PID: $PID）${NC}"
    fi
    rm -f "$WORKTREE_FULL_PATH/.minio.pid"
else
    echo -e "${YELLOW}MinIOは起動していません${NC}"
fi

# worktreeの削除
echo -e "${YELLOW}worktreeを削除しています...${NC}"

# プロセスがディレクトリを使用していないか確認
if lsof "$WORKTREE_FULL_PATH" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  worktreeディレクトリが使用中です。プロセスを終了してください${NC}"
    lsof "$WORKTREE_FULL_PATH" | head -10
fi

# まずgit worktree removeを試す
if git worktree remove "$WORKTREE_PATH" 2>/dev/null; then
    echo -e "${GREEN}✅ worktreeが正常に削除されました${NC}"
else
    # 強制削除オプションを使用
    echo -e "${YELLOW}通常の削除に失敗しました。強制削除を試みます...${NC}"
    if git worktree remove --force "$WORKTREE_PATH" 2>/dev/null; then
        echo -e "${GREEN}✅ worktreeが強制的に削除されました${NC}"
    else
        # 手動削除とprune
        echo -e "${YELLOW}Git経由の削除に失敗しました。手動で削除します...${NC}"
        if [ -d "$WORKTREE_FULL_PATH" ]; then
            rm -rf "$WORKTREE_FULL_PATH"
        fi
        git worktree prune
        echo -e "${GREEN}✅ worktreeが手動で削除されました${NC}"
    fi
fi

# PostgreSQLデータベースの削除
echo ""
echo -e "${YELLOW}PostgreSQLデータベースを削除しています...${NC}"

if command -v psql &> /dev/null; then
    # データベースが存在するか確認
    if psql -U $USER -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        # データベースへの接続を切断
        echo -e "${YELLOW}データベースへの接続を切断しています...${NC}"
        psql -U $USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
        
        # データベースを削除
        if dropdb "$DB_NAME" 2>/dev/null; then
            echo -e "${GREEN}✅ データベース '$DB_NAME' を削除しました${NC}"
        else
            echo -e "${RED}⚠️  データベース '$DB_NAME' の削除に失敗しました${NC}"
            echo "   手動で削除してください: dropdb $DB_NAME"
        fi
    else
        echo -e "${YELLOW}データベース '$DB_NAME' は既に削除されています${NC}"
    fi
else
    echo -e "${YELLOW}PostgreSQLがインストールされていないため、データベースの削除をスキップします${NC}"
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
                # git worktree listでブランチ名を取得（スペースを含むパスに対応）
                local branch_info=$(git worktree list | grep "work/$dir_name" | grep -o '\[.*\]' | sed 's/\[//' | sed 's/\]//')

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

# workspaceファイルを更新
update_vscode_workspace

# ブランチの削除
echo ""
echo -e "${YELLOW}関連するブランチを削除しています...${NC}"

# ブランチが既に削除されているか確認
if [ -z "$BRANCH_NAME" ]; then
    echo -e "${YELLOW}ブランチ情報が取得できませんでした${NC}"
    # リモートブランチから推測
    POSSIBLE_BRANCH="feature/${WORKTREE_NAME}"
    if git show-ref --verify --quiet "refs/heads/$POSSIBLE_BRANCH"; then
        BRANCH_NAME="$POSSIBLE_BRANCH"
    fi
fi

if [ -n "$BRANCH_NAME" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        # 現在のブランチでないことを確認
        CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
        if [ "$CURRENT_BRANCH" = "$BRANCH_NAME" ]; then
            echo -e "${RED}エラー: 現在チェックアウトしているブランチは削除できません${NC}"
        else
            # 強制削除を最初から試す（ワークツリーブランチは通常マージされていないため）
            if git branch -D "$BRANCH_NAME" 2>/dev/null; then
                echo -e "${GREEN}✅ ブランチ '$BRANCH_NAME' が削除されました${NC}"
            else
                echo -e "${RED}⚠️  ブランチ '$BRANCH_NAME' の削除に失敗しました${NC}"
                git branch -v | grep "$BRANCH_NAME" || true
            fi
        fi
    else
        echo -e "${YELLOW}ブランチ '$BRANCH_NAME' は既に削除されています${NC}"
    fi
else
    echo -e "${YELLOW}ブランチ情報が取得できませんでした${NC}"
fi

# 完了メッセージ
echo ""
echo -e "${GREEN}🎉 処理が完了しました${NC}"
echo ""
echo -e "${GREEN}削除されたリソース:${NC}"
echo -e "${GREEN}  - worktree: $WORKTREE_PATH${NC}"
echo -e "${GREEN}  - ブランチ: $BRANCH_NAME${NC}"
echo -e "${GREEN}  - データベース: $DB_NAME${NC}"
echo ""
echo "現在のworktree一覧:"
git worktree list