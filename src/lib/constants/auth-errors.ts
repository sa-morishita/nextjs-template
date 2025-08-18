export const AUTH_ERROR_MESSAGES = {
  'invalid-token': 'メールの確認に失敗しました。再度お試しください。',
  'invalid-link': '無効なリンクです。',
  'expired-link': 'リンクの有効期限が切れています。',
  'user-exists': 'このメールアドレスは既に登録されています。',
  unauthorized: 'ログインが必要です。',
  OAuthAccountNotLinked: 'このアカウントは既に別の方法で登録されています。',
  OAuthCallbackError:
    'LINE認証でエラーが発生しました。もう一度お試しください。',
  Configuration: '認証設定にエラーがあります。管理者にお問い合わせください。',
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;
