/**
 * クライアントサイドの画像アップロード関連サービス
 */

/**
 * クライアントサイドでPresigned URLを使用してファイルをアップロード
 */
export interface SignedUploadRequest {
  url: string;
  headers: Record<string, string>;
}

export async function uploadFileWithSignedUrl(
  file: File,
  upload: SignedUploadRequest,
): Promise<void> {
  const headers: Record<string, string> = {
    ...upload.headers,
    'Cache-Control': 'max-age=3600',
  };

  if (!headers['Content-Type']) {
    headers['Content-Type'] = file.type;
  }

  const response = await fetch(upload.url, {
    method: 'PUT',
    body: file,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', response.status, errorText);
    throw new Error('ファイルのアップロードに失敗しました');
  }
}
