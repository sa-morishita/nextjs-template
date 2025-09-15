開発・本番両環境に新しいパブリックストレージバケットを作成

---
allowed-tools: ["Edit", "Read", "Bash"]
description: "MinIOとSupabase両方に新しいパブリックバケットを設定"
---

# create-storage-bucket

開発環境（MinIO）と本番環境（Supabase）の両方に新しいパブリックストレージバケットを作成します。

## Instructions

バケット設定を解析: $ARGUMENTS

期待される形式:
- バケット名（必須、英数字とハイフン）

例:
- `avatars` → avatars バケット作成
- `documents` → documents バケット作成

1. bucket-config.tsに設定を追加（先に手動で追加が必要）

2. supabase/config.tomlに最小限の設定を追加
   - [storage.buckets.{バケット名}] セクションを追加
   - public = true のみ設定
   - サイズ制限とMIMEタイプはアプリケーション側で制御

3. src/lib/storage/client.tsを更新
   - ファイル末尾のエクスポート部分に追加
   - `export const {バケット名}Storage = new UnifiedStorage('{バケット名}');`

4. MinIOが起動している場合、バケットを作成
   - MinIO Clientがインストールされているか確認
     ```bash
     which mc || (echo "⚠️  MinIO Client (mc) がインストールされていません" && echo "インストールコマンド: brew install minio-mc" && exit 1)
     ```
   
   - .env.localを確認
     ```bash
     test -f .env.local && source .env.local || (echo "⚠️  .env.localが見つかりません" && exit 1)
     ```
   
   - MinIOが起動しているか確認
     ```bash
     test -f .minio.pid || (echo "⚠️  MinIOが起動していません（/dev:setup-storage で起動してください）" && exit 1)
     ```
   
   - MinIOエイリアスを設定してバケットを作成
     ```bash
     BUCKET_NAME=$(echo $ARGUMENTS | awk '{print $1}')
     mc alias set local-minio http://localhost:$DEV_MINIO_PORT minioadmin minioadmin
     mc mb local-minio/$BUCKET_NAME && mc anonymous set public local-minio/$BUCKET_NAME && echo "✅ MinIOバケット作成完了"
     ```

5. 変更内容のサマリー表示
   - 追加されたバケット名
   - 設定内容（サイズ制限、MIMEタイプ）
   - 次のステップの案内（MinIO起動が必要な場合）