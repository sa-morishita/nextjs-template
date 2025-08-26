/**
 * クライアントサイドでのblurDataURL生成ユーティリティ
 */

/**
 * ファイルからblurDataURLを生成する
 * Canvas APIを使用してクライアントサイドで実行
 *
 * @param file - 画像ファイル
 * @returns Promise<string> - base64エンコードされたblurDataURL
 */
export const generateClientBlurDataURL = async (
  file: File,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // 超小サイズ（8x8推奨）でファイルサイズを最小化
        canvas.width = 8;
        canvas.height = 8;

        // 軽いblur効果を適用
        ctx.filter = 'blur(1px)';
        ctx.drawImage(img, 0, 0, 8, 8);

        // 高圧縮JPEG（品質30%）でbase64生成
        const blurDataUrl = canvas.toDataURL('image/jpeg', 0.3);

        // メモリクリーンアップ
        URL.revokeObjectURL(img.src);

        resolve(blurDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // FileからObject URLを作成して画像として読み込み
    img.src = URL.createObjectURL(file);
  });
};
