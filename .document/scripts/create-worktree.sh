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

    # 2. 依存関係のインストール
    echo -e "${YELLOW}依存関係をインストールしています...${NC}"
    if command -v pnpm >/dev/null 2>&1; then
        pnpm install
        echo -e "${GREEN}✅ pnpm installが完了しました${NC}"
    else
        echo -e "${RED}エラー: pnpmが見つかりません${NC}"
        exit 1
    fi

    # Supabaseがインストールされているか確認
    if ! command -v supabase >/dev/null 2>&1; then
        echo -e "${YELLOW}Supabase CLIがインストールされていません。インストールしてください${NC}"
        echo "  brew install supabase/tap/supabase"
    fi

    # 3. Drizzleスキーマのプッシュ
    echo -e "${YELLOW}Drizzleスキーマをプッシュしています...${NC}"
    if pnpm db:push; then
        echo -e "${GREEN}✅ Drizzleスキーマのプッシュが完了しました${NC}"
    else
        echo -e "${RED}⚠️  Drizzleスキーマのプッシュに失敗しました${NC}"
    fi

    # 4. Git hooksのセットアップ
    echo -e "${YELLOW}Git hooksをセットアップしています...${NC}"
    if pnpm run prepare; then
        echo -e "${GREEN}✅ Git hooks（Lefthook）のセットアップが完了しました${NC}"
    else
        echo -e "${RED}⚠️  Git hooksのセットアップに失敗しました${NC}"
    fi

    # .gitignoreにsupabase/config.tomlを追加（まだ存在しない場合）
    if ! grep -q "^supabase/config\.toml$" .gitignore 2>/dev/null; then
        echo -e "${YELLOW}.gitignoreにsupabase/config.tomlを追加しています...${NC}"
        echo "" >> .gitignore
        echo "# Worktree specific Supabase config" >> .gitignore
        echo "supabase/config.toml" >> .gitignore
        echo -e "${GREEN}✅ .gitignoreにsupabase/config.tomlを追加しました${NC}"
    else
        echo -e "${BLUE}📝 supabase/config.tomlは既に.gitignoreに存在します${NC}"
    fi


    # 5. Supabase Localのセットアップ
    if command -v supabase >/dev/null 2>&1; then
        echo -e "${YELLOW}Supabase Localのセットアップを確認しています...${NC}"

        # Supabaseが初期化されているか確認
        if [ ! -f "supabase/config.toml" ]; then
            echo -e "${YELLOW}Supabaseを初期化しています...${NC}"
            if supabase init; then
                echo -e "${GREEN}✅ Supabaseの初期化が完了しました${NC}"
            else
                echo -e "${RED}⚠️  Supabaseの初期化に失敗しました${NC}"
            fi
        fi

        # worktree用のポート設定を生成
        WORKTREE_PORT_OFFSET=$(echo "$WORKTREE_NAME" | cksum | cut -d' ' -f1)
        WORKTREE_PORT_OFFSET=$((WORKTREE_PORT_OFFSET % 1000))

        API_PORT=$((54321 + WORKTREE_PORT_OFFSET))
        DB_PORT=$((54322 + WORKTREE_PORT_OFFSET))
        STUDIO_PORT=$((54323 + WORKTREE_PORT_OFFSET))
        INBUCKET_PORT=$((54324 + WORKTREE_PORT_OFFSET))
        ANALYTICS_PORT=$((54327 + WORKTREE_PORT_OFFSET))

        # worktree専用のSupabase設定を作成
        if [ -f "supabase/config.toml" ]; then
            echo -e "${YELLOW}worktree専用のSupabase設定を作成しています...${NC}"

            # config.toml.exampleからconfig.tomlを作成
            if [ -f "../../supabase/config.toml.example" ]; then
                cp "../../supabase/config.toml.example" "supabase/config.toml"
            else
                # フォールバック: メインのconfig.tomlからコピー
                cp "../../supabase/config.toml" "supabase/config.toml"
            fi

            # project_idを変更
            sed -i.bak "s/project_id = \".*\"/project_id = \"${WORKTREE_NAME}\"/" supabase/config.toml

            # ポート番号を変更
            sed -i.bak "s/port = 54321/port = ${API_PORT}/" supabase/config.toml
            sed -i.bak "s/port = 54322/port = ${DB_PORT}/" supabase/config.toml
            sed -i.bak "s/port = 54323/port = ${STUDIO_PORT}/" supabase/config.toml
            sed -i.bak "s/port = 54324/port = ${INBUCKET_PORT}/" supabase/config.toml
            sed -i.bak "s/port = 54327/port = ${ANALYTICS_PORT}/" supabase/config.toml

            # バックアップファイルを削除
            rm -f supabase/config.toml.bak

            echo -e "${GREEN}✅ worktree専用のSupabase設定が完了しました${NC}"
            echo -e "${BLUE}  API URL: http://localhost:${API_PORT}${NC}"
            echo -e "${BLUE}  DB URL: postgresql://postgres:postgres@localhost:${DB_PORT}/postgres${NC}"
            echo -e "${BLUE}  Studio URL: http://localhost:${STUDIO_PORT}${NC}"
            echo -e "${BLUE}  Inbucket URL: http://localhost:${INBUCKET_PORT}${NC}"
            echo -e "${BLUE}  Analytics URL: http://localhost:${ANALYTICS_PORT}${NC}"

            # .env.localのDB URLを更新
            if [ -f ".env.local" ]; then
                sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://postgres:postgres@localhost:${DB_PORT}/postgres\"|" .env.local
                sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=\"http://localhost:${API_PORT}\"|" .env.local
                rm -f .env.local.bak
                echo -e "${GREEN}✅ .env.localのDB設定を更新しました${NC}"
            fi

            # .env.test.localの更新
            if [ -f "../../.env.test.local" ]; then
                cp "../../.env.test.local" ".env.test.local"
                sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=\"http://localhost:${API_PORT}\"|" .env.test.local
                rm -f .env.test.local.bak
                echo -e "${GREEN}✅ .env.test.localをコピーして設定を更新しました${NC}"
            fi

            # next.config.tsにworktree用のSupabase StorageのremotePatternを追加
            echo -e "${YELLOW}next.config.tsにSupabase StorageのremotePatternを追加しています...${NC}"
            
            # TypeScriptファイルを更新するためのNode.jsスクリプトを実行
            cat > update-next-config.js << 'NODEJS_SCRIPT'
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'next.config.ts');
const apiPort = process.argv[2];

if (!apiPort) {
    console.error('API port is required');
    process.exit(1);
}

// next.config.tsの内容を読み取る
let content = fs.readFileSync(configPath, 'utf8');

// 新しいremotePatternエントリを作成
const newPattern = `      // Supabase Storage (worktree: ${process.env.USER || 'unknown'}/${path.basename(path.dirname(process.cwd()))})
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '${apiPort}',
        pathname: '/storage/v1/object/public/**',
      },`;

// remotePatterns配列の終了位置を見つける
const remotePatternsStart = content.indexOf('remotePatterns: [');
if (remotePatternsStart === -1) {
    console.error('remotePatterns not found in next.config.ts');
    process.exit(1);
}

// 最初の閉じ括弧の位置を見つける（remotePatterns配列の終了）
let bracketCount = 0;
let inRemotePatterns = false;
let insertPosition = -1;

for (let i = remotePatternsStart; i < content.length; i++) {
    if (content[i] === '[') {
        if (!inRemotePatterns) {
            inRemotePatterns = true;
        }
        bracketCount++;
    } else if (content[i] === ']' && inRemotePatterns) {
        bracketCount--;
        if (bracketCount === 0) {
            insertPosition = i;
            break;
        }
    }
}

if (insertPosition === -1) {
    console.error('Could not find the end of remotePatterns array');
    process.exit(1);
}

// 既に同じポートのエントリが存在するかチェック
if (content.includes(`port: '${apiPort}'`)) {
    console.log(`RemotePattern for port ${apiPort} already exists`);
    process.exit(0);
}

// 新しいパターンを挿入
content = content.slice(0, insertPosition) + '\n' + newPattern + '\n    ' + content.slice(insertPosition);

// ファイルに書き戻す
fs.writeFileSync(configPath, content, 'utf8');
console.log(`Added remotePattern for Supabase Storage on port ${apiPort}`);
NODEJS_SCRIPT

            if node update-next-config.js "${API_PORT}"; then
                echo -e "${GREEN}✅ next.config.tsへのremotePattern追加が完了しました${NC}"
                echo -e "${BLUE}  Storage URL: http://localhost:${API_PORT}/storage/v1/object/public/**${NC}"
            else
                echo -e "${RED}⚠️  next.config.tsの更新に失敗しました${NC}"
            fi
            
            # 一時ファイルを削除
            rm -f update-next-config.js
        fi

        # Supabase Localを起動
        echo -e "${YELLOW}Supabase Localを起動しています...${NC}"
        if supabase start; then
            echo -e "${GREEN}✅ Supabase Localが起動しました${NC}"
            
            # データベースマイグレーションを実行
            echo -e "${YELLOW}データベースマイグレーションを実行しています...${NC}"
            if pnpm db:migrate:dev; then
                echo -e "${GREEN}✅ データベースマイグレーションが完了しました${NC}"
            else
                echo -e "${RED}⚠️  データベースマイグレーションに失敗しました${NC}"
                echo -e "${YELLOW}   手動で実行してください: pnpm db:migrate:dev${NC}"
            fi
        else
            echo -e "${RED}⚠️  Supabase Localの起動に失敗しました${NC}"
            echo -e "${BLUE}📝 手動でSupabase Localを開始するには:${NC}"
            echo -e "${YELLOW}   cd $WORKTREE_PATH && supabase start${NC}"
            echo -e "${YELLOW}   その後: pnpm db:migrate:dev${NC}"
        fi
        
        echo -e "${BLUE}📝 このworktreeはメインのSupabaseとは独立して動作します${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase CLIがインストールされていません${NC}"
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
echo -e "${BLUE}作成されたワークツリーのパス:${NC}"
echo "$WORKTREE_PATH"
echo ""
echo -e "${BLUE}現在のworktree一覧:${NC}"
git worktree list
