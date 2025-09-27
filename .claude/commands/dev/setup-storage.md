MinIOサーバー起動

---
allowed-tools: ["Bash"]
description: "開発環境用のMinIOサーバーを起動"
---

# setup-storage

開発環境用のMinIOサーバーを起動し、共有バケット `app` を初期化します。

## Instructions

1. MinIOを起動
   !source .env.local && (test -f .minio.pid && echo "⚠️  MinIOは既に起動しています" || (minio server "$MINIO_DATA_DIR" --address ":$MINIO_PORT" --console-address ":$MINIO_CONSOLE_PORT" > /tmp/minio.log 2>&1 & echo $! > .minio.pid && sleep 3 && echo "🚀 MinIO起動完了"))

2. 共有バケット `app` を初期化
   !if ! command -v mc >/dev/null 2>&1; then echo "⚠️  MinIO Client (mc) が見つかりません。brew install minio-mc でインストールしてください"; else source .env.local && mc alias set local-minio "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null 2>&1 && (mc mb --ignore-existing local-minio/app >/dev/null 2>&1 && mc anonymous set public local-minio/app >/dev/null 2>&1 && echo "✅ バケット app の準備が完了しました" || echo "⚠️  バケット app の初期化に失敗しました") fi

3. 完了メッセージ
   !source .env.local && echo -e "\n🎉 MinIO起動完了\n🗄️  API: http://localhost:$MINIO_PORT\n🌐 Console: http://localhost:$MINIO_CONSOLE_PORT (minioadmin/minioadmin)\n\n🛑 停止: /dev:stop-storage"
