MinIOサーバー起動

---
allowed-tools: ["Bash", "Read"]
description: "開発環境用のMinIOサーバーを起動（環境変数からポート番号を自動取得）"
---

# setup-storage

開発環境用のMinIOサーバーを起動し、共有バケット `app` を初期化します。
プロジェクトごとに異なるポート番号を環境変数から自動的に読み取ります。

## Instructions

1. 環境変数の確認と表示
   !if [ -f .env.local ]; then source .env.local && echo "📋 MinIO設定:" && echo "  - ポート: $MINIO_PORT" && echo "  - コンソールポート: $MINIO_CONSOLE_PORT" && echo "  - データディレクトリ: $MINIO_DATA_DIR" && echo "  - バケット: $MINIO_BUCKET"; else echo "❌ .env.localファイルが見つかりません。setup-development-environment.shを実行してください"; exit 1; fi

2. MinIOがインストールされているか確認
   !if ! command -v minio >/dev/null 2>&1; then echo "⚠️  MinIOがインストールされていません。インストールしています..." && brew install minio && echo "✅ MinIOのインストールが完了しました"; fi

3. 既存のMinIOプロセスをチェック
   !source .env.local && if [ -f .minio.pid ] && ps -p $(cat .minio.pid) > /dev/null 2>&1; then echo "⚠️  MinIOは既にポート $MINIO_PORT で起動しています (PID: $(cat .minio.pid))"; else echo "✅ MinIOは起動していません。起動準備をします..."; fi

4. MinIOを起動
   !source .env.local && if [ -f .minio.pid ] && ps -p $(cat .minio.pid) > /dev/null 2>&1; then echo "⏭️  既に起動しているためスキップします"; else (minio server "$MINIO_DATA_DIR" --address ":$MINIO_PORT" --console-address ":$MINIO_CONSOLE_PORT" > /tmp/minio-$MINIO_PORT.log 2>&1 & echo $! > .minio.pid && sleep 3 && echo "🚀 MinIO起動完了 (ポート: $MINIO_PORT)"); fi

5. MinIO Clientのインストール確認
   !if ! command -v mc >/dev/null 2>&1; then echo "⚠️  MinIO Client (mc) が見つかりません。brew install minio-mc でインストールしてください"; else echo "✅ MinIO Client (mc) は利用可能です"; fi

6. 共有バケット `app` を初期化
   !if command -v mc >/dev/null 2>&1; then source .env.local && mc alias set local-minio "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null 2>&1 && (mc mb --ignore-existing local-minio/$MINIO_BUCKET >/dev/null 2>&1 && mc anonymous set public local-minio/$MINIO_BUCKET >/dev/null 2>&1 && echo "✅ バケット $MINIO_BUCKET の準備が完了しました" || echo "⚠️  バケット $MINIO_BUCKET の初期化に失敗しました"); fi

7. 完了メッセージ
   !source .env.local && echo -e "\n🎉 MinIO起動完了\n🗄️  API: $MINIO_ENDPOINT\n🌐 Console: http://localhost:$MINIO_CONSOLE_PORT (minioadmin/minioadmin)\n📦 バケット: $MINIO_BUCKET\n📁 データ: $MINIO_DATA_DIR\n\n🛑 停止: /dev:stop-storage"
