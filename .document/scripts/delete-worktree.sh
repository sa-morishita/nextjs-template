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

# 確認プロンプト
echo ""
echo -e "${YELLOW}⚠️  警告: この操作は取り消せません${NC}"
echo -e "${YELLOW}worktree '$WORKTREE_NAME' とブランチ '$BRANCH_NAME' を削除しますか？${NC}"
echo -n "削除する場合は 'yes' と入力してください: "
read -r CONFIRMATION

if [ "$CONFIRMATION" != "yes" ]; then
    echo -e "${YELLOW}削除をキャンセルしました${NC}"
    exit 0
fi

# Supabase Localの停止
echo -e "${YELLOW}Supabase Localを確認しています...${NC}"

# worktreeディレクトリでSupabaseが実行中か確認
if [ -d "$WORKTREE_FULL_PATH" ] && [ -f "$WORKTREE_FULL_PATH/supabase/config.toml" ]; then
    # worktreeディレクトリに移動
    cd "$WORKTREE_FULL_PATH"

    # Supabaseのステータスを確認
    if command -v supabase >/dev/null 2>&1; then
        # Supabaseが実行中か確認
        if supabase status 2>/dev/null | grep -q "API URL"; then
            echo -e "${YELLOW}Supabase Localが実行中です。停止しています...${NC}"
            if supabase stop; then
                echo -e "${GREEN}✅ Supabase Localが停止されました${NC}"
            else
                echo -e "${RED}⚠️  Supabase Localの停止に失敗しました${NC}"
            fi
        else
            echo -e "${BLUE}Supabase Localは実行されていません${NC}"
        fi
    fi

    # プロジェクトルートに戻る
    cd "$PROJECT_ROOT"
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

# Dockerコンテナのクリーンアップ
if command -v docker >/dev/null 2>&1; then
    echo ""
    echo -e "${YELLOW}Dockerコンテナを確認しています...${NC}"

    # Supabase関連のDockerコンテナを検索
    CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "supabase.*${WORKTREE_NAME}" || true)

    if [ -n "$CONTAINERS" ]; then
        echo -e "${YELLOW}関連するDockerコンテナが見つかりました。削除します...${NC}"
        echo "$CONTAINERS" | while read -r container; do
            if docker rm -f "$container" 2>/dev/null; then
                echo -e "${GREEN}✅ コンテナ '$container' を削除しました${NC}"
            else
                echo -e "${RED}⚠️  コンテナ '$container' の削除に失敗しました${NC}"
            fi
        done
    else
        echo -e "${BLUE}関連するDockerコンテナはありません${NC}"
    fi

    # Dockerボリュームのクリーンアップ
    VOLUMES=$(docker volume ls --format "{{.Name}}" | grep -E "supabase.*${WORKTREE_NAME}" || true)

    if [ -n "$VOLUMES" ]; then
        echo -e "${YELLOW}関連するDockerボリュームが見つかりました。削除します...${NC}"
        echo "$VOLUMES" | while read -r volume; do
            if docker volume rm "$volume" 2>/dev/null; then
                echo -e "${GREEN}✅ ボリューム '$volume' を削除しました${NC}"
            else
                echo -e "${RED}⚠️  ボリューム '$volume' の削除に失敗しました${NC}"
            fi
        done
    fi
fi

# 完了メッセージ
echo ""
echo -e "${GREEN}処理が完了しました${NC}"

echo ""
echo "現在のworktree一覧:"
git worktree list
