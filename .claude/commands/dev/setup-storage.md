MinIOサーバー起動

---
allowed-tools: ["Bash"]
description: "開発環境用のMinIOサーバーを起動"
---

# setup-storage

開発環境用のMinIOサーバーを起動します。バケットの作成は`/dev:create-storage-bucket`を使用してください。

## Instructions

1. MinIOを起動
   !source .env.local && (test -f .minio.pid && echo "⚠️  MinIOは既に起動しています" || (minio server "$DEV_MINIO_DATA_DIR" --address ":$DEV_MINIO_PORT" --console-address ":$DEV_MINIO_CONSOLE_PORT" > /tmp/minio.log 2>&1 & echo $! > .minio.pid && sleep 3 && echo "🚀 MinIO起動完了"))

2. 完了メッセージ
   !source .env.local && echo -e "\n🎉 MinIO起動完了\n🗄️  API: http://localhost:$DEV_MINIO_PORT\n🌐 Console: http://localhost:$DEV_MINIO_CONSOLE_PORT (minioadmin/minioadmin)\n\n📦 バケット作成: /dev:create-storage-bucket [バケット名]\n🛑 停止: /dev:stop-storage"