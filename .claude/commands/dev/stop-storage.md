MinIOサーバーを停止

---
allowed-tools: ["Bash"]
description: "開発環境のMinIOを停止（環境変数からポート番号を自動取得）"
---

# stop-storage

実行中のMinIOサーバーを停止します。
プロジェクトごとに異なるポート番号を環境変数から自動的に読み取ります。

## Instructions

1. 環境変数の確認
   !if [ -f .env.local ]; then source .env.local && echo "📋 停止対象MinIO設定:" && echo "  - ポート: $MINIO_PORT" && echo "  - データディレクトリ: $MINIO_DATA_DIR"; else echo "❌ .env.localファイルが見つかりません"; fi

2. PIDファイルの確認
   !test -f .minio.pid && echo "✅ PIDファイル確認 (PID: $(cat .minio.pid))" || echo "⚠️  MinIOは起動していません"

3. PIDの有効性確認
   !if [ -f .minio.pid ]; then if kill -0 $(cat .minio.pid) 2>/dev/null; then source .env.local && echo "✅ MinIOプロセス確認 (ポート: $MINIO_PORT)"; else rm .minio.pid && echo "⚠️  古いPIDファイルをクリーンアップしました"; fi; fi

4. MinIOプロセスを停止
   !if [ -f .minio.pid ] && kill -0 $(cat .minio.pid) 2>/dev/null; then source .env.local && kill $(cat .minio.pid) && echo "✅ MinIOを停止しました (ポート: $MINIO_PORT)"; else echo "⚠️  停止するMinIOプロセスがありません"; fi

5. PIDファイルを削除
   !test -f .minio.pid && rm -f .minio.pid && echo "✅ PIDファイルを削除しました" || echo "⚠️  PIDファイルが存在しません"

6. 念のためプロセスを確認
   !sleep 1
   !if [ -f .env.local ]; then source .env.local && if pgrep -f "minio server.*$MINIO_PORT" > /dev/null; then echo "⚠️  MinIOプロセス (ポート: $MINIO_PORT) がまだ残っています。強制終了します..." && pkill -f "minio server.*$MINIO_PORT" && echo "✅ 強制終了完了"; else echo "✅ MinIOプロセス (ポート: $MINIO_PORT) は完全に停止しました"; fi; fi

7. ログファイルのクリーンアップ（オプション）
   !if [ -f .env.local ]; then source .env.local && if [ -f "/tmp/minio-$MINIO_PORT.log" ]; then echo "📝 ログファイル /tmp/minio-$MINIO_PORT.log が残っています（必要に応じて削除してください）"; fi; fi

8. 完了メッセージ
   !echo ""
   !if [ -f .env.local ]; then source .env.local && echo "🛑 MinIO (ポート: $MINIO_PORT) が停止しました"; else echo "🛑 MinIOが停止しました"; fi
   !echo "再起動するには: /dev:setup-storage"
