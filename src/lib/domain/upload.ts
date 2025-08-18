/**
 * アップロード（Upload）ドメインの定数定義
 */

// アップロード関連のバリデーションルール
export const UPLOAD_VALIDATION = {
  // ファイルサイズ
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_MB: 5,

  // 許可される画像形式
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as const,

  // ファイル名
  MAX_FILENAME_LENGTH: 255,
  FILENAME_PATTERN: /^[^/\\:*?"<>|]+$/, // 一般的な無効な文字を除外
} as const;

// アップロード関連のメッセージ
export const UPLOAD_MESSAGES = {
  // ファイルサイズ関連
  FILE_TOO_LARGE: `画像は${UPLOAD_VALIDATION.MAX_FILE_SIZE_MB}MB以下にしてください`,
  FILE_TOO_SMALL: 'ファイルサイズが小さすぎます',

  // ファイルタイプ関連
  INVALID_FILE_TYPE: 'サポートされていない画像形式です',
  SUPPORTED_FORMATS: '対応形式: JPEG, PNG, WebP',

  // ファイル名関連
  FILENAME_TOO_LONG: 'ファイル名が長すぎます',
  FILENAME_INVALID_CHARS: 'ファイル名に使用できない文字が含まれています',

  // アップロード処理関連
  UPLOAD_SUCCESS: '画像をアップロードしました',
  UPLOAD_ERROR: '画像のアップロードに失敗しました',
  UPLOAD_URL_GENERATION_ERROR: 'アップロードURLの生成に失敗しました',
  UPLOAD_IN_PROGRESS: 'アップロード中...',

  // その他
  NO_FILE_SELECTED: 'ファイルが選択されていません',
  FILE_READ_ERROR: 'ファイルの読み込みに失敗しました',
} as const;

// アップロード関連のタイプ
export type AllowedImageType =
  (typeof UPLOAD_VALIDATION.ALLOWED_IMAGE_TYPES)[number];

/**
 * ファイルタイプが許可されているかチェック
 */
export function isAllowedImageType(
  fileType: string,
): fileType is AllowedImageType {
  return UPLOAD_VALIDATION.ALLOWED_IMAGE_TYPES.includes(
    fileType as AllowedImageType,
  );
}

/**
 * ファイルサイズが有効範囲内かチェック
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= UPLOAD_VALIDATION.MAX_FILE_SIZE;
}

/**
 * ファイル名が有効かチェック
 */
export function isValidFileName(fileName: string): boolean {
  return (
    fileName.length > 0 &&
    fileName.length <= UPLOAD_VALIDATION.MAX_FILENAME_LENGTH &&
    UPLOAD_VALIDATION.FILENAME_PATTERN.test(fileName)
  );
}
