/**
 * ストレージプレフィックスの設定を定義
 */

export interface PrefixConfig {
  name: string;
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  isPublic: boolean;
}

// プレフィックス設定の定義（プロジェクトに応じて変更可能）
export const PREFIX_CONFIGS: Record<string, PrefixConfig> = {
  avatars: {
    name: 'avatars',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    isPublic: true,
  },
  diaries: {
    name: 'diaries',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    isPublic: true,
  },
  // プロジェクトに応じて追加
  // documents: {
  //   name: 'documents',
  //   maxFileSize: 10 * 1024 * 1024, // 10MB
  //   allowedMimeTypes: ['application/pdf', 'application/msword'],
  //   isPublic: false,
  // },
};

// プレフィックス名の型安全な取得
export type PrefixName = keyof typeof PREFIX_CONFIGS;

// ヘルパー関数
export function getPrefixConfig(prefixName: string): PrefixConfig | undefined {
  return PREFIX_CONFIGS[prefixName];
}

export function validateFile(
  prefixName: string,
  file: { type: string; size: number },
): { valid: boolean; error?: string } {
  const config = getPrefixConfig(prefixName);
  if (!config) {
    return { valid: false, error: 'Invalid prefix name' };
  }

  // MIMEタイプチェック
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `ファイル形式が許可されていません。許可: ${config.allowedMimeTypes.join(', ')}`,
    };
  }

  // ファイルサイズチェック
  if (file.size > config.maxFileSize) {
    const sizeMB = Math.round(config.maxFileSize / 1024 / 1024);
    return {
      valid: false,
      error: `ファイルサイズは${sizeMB}MB以下にしてください`,
    };
  }

  return { valid: true };
}
