/**
 * 認証（Auth）ドメインの定数定義
 */

// 認証関連のバリデーションルール
export const AUTH_VALIDATION = {
  // パスワード
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100,
  PASSWORD_PATTERN:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/,

  // メールアドレス
  EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  MAX_EMAIL_LENGTH: 255,

  // 名前
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,

  // トークン
  TOKEN_EXPIRY_MINUTES: 60, // パスワードリセットトークンの有効期限（分）
} as const;

// 認証関連のメッセージ
export const AUTH_MESSAGES = {
  // サインイン
  SIGNIN_SUCCESS: 'ログインしました',
  SIGNIN_ERROR: 'ログインに失敗しました',
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  EMAIL_NOT_VERIFIED: 'メールアドレスが認証されていません',

  // サインアップ
  SIGNUP_SUCCESS: 'アカウントを作成しました。確認メールをご確認ください',
  SIGNUP_ERROR: 'アカウント作成に失敗しました',
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',

  // サインアウト
  SIGNOUT_SUCCESS: 'ログアウトしました',
  SIGNOUT_ERROR: 'ログアウトに失敗しました',

  // メール認証
  EMAIL_VERIFICATION_SENT: '確認メールを送信しました',
  EMAIL_VERIFICATION_SUCCESS: 'メールアドレスを認証しました',
  EMAIL_VERIFICATION_ERROR: 'メールアドレスの認証に失敗しました',
  EMAIL_VERIFICATION_RESENT: '確認メールを再送信しました',
  INVALID_VERIFICATION_TOKEN: '無効な認証トークンです',

  // パスワードリセット
  PASSWORD_RESET_EMAIL_SENT: 'パスワードリセットメールを送信しました',
  PASSWORD_RESET_SUCCESS: 'パスワードをリセットしました',
  PASSWORD_RESET_ERROR: 'パスワードリセットに失敗しました',
  INVALID_RESET_TOKEN: '無効なリセットトークンです',
  RESET_TOKEN_EXPIRED: 'リセットトークンの有効期限が切れています',

  // バリデーションメッセージ
  EMAIL_REQUIRED: 'メールアドレスを入力してください',
  EMAIL_INVALID: '有効なメールアドレスを入力してください',
  PASSWORD_REQUIRED: 'パスワードを入力してください',
  PASSWORD_TOO_SHORT: `パスワードは${AUTH_VALIDATION.MIN_PASSWORD_LENGTH}文字以上で入力してください`,
  PASSWORD_TOO_WEAK: 'パスワードは大文字・小文字・数字を含む必要があります',
  PASSWORD_MISMATCH: 'パスワードが一致しません',
  NAME_REQUIRED: '名前を入力してください',
  NAME_TOO_LONG: `名前は${AUTH_VALIDATION.MAX_NAME_LENGTH}文字以内で入力してください`,

  // その他
  UNAUTHORIZED: '認証が必要です',
  SESSION_EXPIRED: 'セッションの有効期限が切れました',
  ACCOUNT_DISABLED: 'アカウントが無効化されています',
} as const;

// 認証状態
export const AUTH_STATUS = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  LOADING: 'loading',
} as const;

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS];

/**
 * メールアドレスの妥当性チェック
 */
export function isValidEmail(email: string): boolean {
  return (
    AUTH_VALIDATION.EMAIL_PATTERN.test(email) &&
    email.length <= AUTH_VALIDATION.MAX_EMAIL_LENGTH
  );
}

/**
 * パスワードの強度チェック
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= AUTH_VALIDATION.MIN_PASSWORD_LENGTH &&
    password.length <= AUTH_VALIDATION.MAX_PASSWORD_LENGTH &&
    AUTH_VALIDATION.PASSWORD_PATTERN.test(password)
  );
}
