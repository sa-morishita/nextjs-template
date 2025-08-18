// Better Authのエラーメッセージと日本語メッセージのマッピング
const authErrorMessages: Record<string, string> = {
  // Better Authの一般的なエラー
  'Invalid email or password':
    'メールアドレスまたはパスワードが正しくありません',
  'User already exists': 'このメールアドレスは既に登録されています',
  'Email is required': 'メールアドレスを入力してください',
  'Password is required': 'パスワードを入力してください',
  'Session expired':
    'セッションの有効期限が切れました。再度ログインしてください',
  'Invalid email format': 'メールアドレスの形式が正しくありません',
  'Password too weak':
    'パスワードが脆弱です。8文字以上で、数字と記号を含めてください',
  'Too many requests':
    'リクエストが多すぎます。しばらく時間をおいて再度お試しください',
  Unauthorized: '認証が必要です',
  // カスタムエラーメッセージ
  ログインに失敗しました: 'メールアドレスまたはパスワードが正しくありません',
  ユーザー登録に失敗しました:
    'ユーザー登録に失敗しました。しばらく時間をおいて再度お試しください',
  認証が必要です: 'ログインが必要です',
};

// 日本語判定用の正規表現（日本語文字が含まれているかをチェック）
const containsJapanese =
  /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/;

export function translateError(error: Error): string {
  // Better Authエラーの処理
  const errorMessage = error.message;

  // エラーメッセージがマッピングに存在する場合
  if (authErrorMessages[errorMessage]) {
    return authErrorMessages[errorMessage];
  }

  // 日本語が含まれているメッセージはそのまま返す（英数字混在も許可）
  if (containsJapanese.test(errorMessage)) {
    return errorMessage;
  }

  // 未知の英語エラー
  return 'エラーが発生しました。しばらく時間をおいて再度お試しください';
}
