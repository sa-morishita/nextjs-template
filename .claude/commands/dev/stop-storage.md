MinIOサーバーを停止

---
allowed-tools: ["Bash"]
description: "開発環境のMinIOを停止"
---

# stop-storage

実行中のMinIOサーバーを停止します。

## Instructions

1. PIDファイルの確認
   !test -f .minio.pid && echo "✅ PIDファイル確認" || echo "⚠️  MinIOは起動していません"

2. PIDの有効性確認
   !test -f .minio.pid && kill -0 $(cat .minio.pid) 2>/dev/null && echo "✅ MinIOプロセス確認" || (test -f .minio.pid && rm .minio.pid && echo "⚠️  PIDファイルをクリーンアップしました")

3. MinIOプロセスを停止
   !test -f .minio.pid && kill -0 $(cat .minio.pid) 2>/dev/null && kill $(cat .minio.pid) && echo "✅ MinIOを停止しました" || echo "⚠️  停止するMinIOプロセスがありません"

4. PIDファイルを削除
   !test -f .minio.pid && rm -f .minio.pid && echo "✅ PIDファイルを削除しました" || echo "⚠️  PIDファイルが存在しません"

5. 念のためプロセスを確認
   !sleep 1
   !source .env.local && pgrep -f "minio server.*$MINIO_PORT" > /dev/null && (echo "⚠️  MinIOプロセスがまだ残っています" && pkill -f "minio server.*$MINIO_PORT") || echo "✅ MinIOプロセスは完全に停止しました"

6. 完了メッセージ
   !echo ""
   !echo "🛑 MinIOが停止しました"
   !echo "再起動するには: /dev:setup-storage"
