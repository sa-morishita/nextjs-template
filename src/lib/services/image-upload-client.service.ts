/**
 * クライアントサイドの画像アップロード関連サービス
 */

/**
 * クライアントサイドでPresigned URLを使用してファイルをアップロード
 */
export async function uploadFileWithSignedUrl(
  file: File,
  signedUrl: string,
): Promise<void> {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Cache-Control': 'max-age=3600',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', response.status, errorText);
    throw new Error('ファイルのアップロードに失敗しました');
  }
}
