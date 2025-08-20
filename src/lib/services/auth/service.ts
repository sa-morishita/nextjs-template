import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './config';

/**
 * Better Auth サービス層
 * 認証関連の実処理を担当
 */

/**
 * エラーオブジェクトの型ガード
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function isBetterAuthError(error: unknown): error is {
  message: string;
  status?: string;
  statusCode?: number;
  body?: unknown;
} {
  return (
    isErrorWithMessage(error) && typeof error === 'object' && error !== null
  );
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

/**
 * メールアドレスとパスワードでサインイン
 */
export async function signInWithEmail(data: SignInData) {
  console.log('🔐 Attempting sign in with:', data.email);

  try {
    const result = await auth.api.signInEmail({
      body: data,
      headers: await headers(),
    });

    console.log('🔐 Sign in result:', result ? 'Success' : 'Failed');
    console.log('🔐 User ID:', result?.user?.id);

    if (!result) {
      throw new Error('ログインに失敗しました');
    }

    return result;
  } catch (error: unknown) {
    if (isBetterAuthError(error)) {
      console.error('🔐 Sign in error details:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        body: error.body,
      });
    } else {
      console.error('🔐 Sign in error:', error);
    }

    // Better Authのエラーステータスをチェック
    if (isBetterAuthError(error)) {
      if (error.status === 'FORBIDDEN' || error.statusCode === 403) {
        if (
          error.message?.includes('Email not verified') ||
          (typeof error.body === 'object' &&
            error.body !== null &&
            'message' in error.body &&
            typeof (error.body as { message: unknown }).message === 'string' &&
            (error.body as { message: string }).message.includes(
              'Email not verified',
            ))
        ) {
          throw new Error(
            'メールアドレスが認証されていません。受信したメールから認証を完了してください。',
          );
        }
      }
    }

    // その他の具体的なエラーメッセージ
    if (isBetterAuthError(error)) {
      const bodyMessage =
        typeof error.body === 'object' &&
        error.body !== null &&
        'message' in error.body &&
        typeof (error.body as { message: unknown }).message === 'string'
          ? (error.body as { message: string }).message
          : '';

      if (
        error.message?.includes('Invalid credentials') ||
        bodyMessage.includes('Invalid credentials')
      ) {
        throw new Error('メールアドレスまたはパスワードが正しくありません。');
      }

      if (
        error.message?.includes('User not found') ||
        bodyMessage.includes('User not found')
      ) {
        throw new Error(
          'このメールアドレスで登録されたアカウントが見つかりません。',
        );
      }

      // デフォルトのエラーメッセージ
      throw new Error(
        'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
      );
    } else {
      throw new Error(
        'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
      );
    }
  }
}

/**
 * メールアドレスとパスワードでサインアップ
 * nextCookiesプラグインが自動的にセッションクッキーを設定
 */
export async function signUpWithEmail(data: SignUpData) {
  console.log('🔐 Attempting sign up with:', data.email);

  const result = await auth.api.signUpEmail({
    body: data,
    headers: await headers(),
  });

  console.log('🔐 Sign up result:', result ? 'Success' : 'Failed');
  console.log('🔐 Sign up user ID:', result?.user?.id);

  if (!result) {
    throw new Error('ユーザー登録に失敗しました');
  }

  return result;
}

/**
 * サインアウト
 */
export async function signOut(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });
}

/**
 * 現在のセッション取得
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/login');
  }

  return session;
}

/**
 * 認証メール再送信
 */
export async function resendVerificationEmail(data: { email: string }) {
  console.log('🔐 Resending verification email to:', data.email);

  const result = await auth.api.sendVerificationEmail({
    body: {
      email: data.email,
      callbackURL: '/', // 認証後のリダイレクト先
    },
    headers: await headers(),
  });

  console.log(
    '🔐 Resend verification email result:',
    result ? 'Success' : 'Failed',
  );

  if (!result) {
    throw new Error('認証メールの再送信に失敗しました');
  }

  return result;
}

export async function requestPasswordReset(data: { email: string }) {
  console.log('🔑 Requesting password reset for:', data.email);

  try {
    const result = await auth.api.forgetPassword({
      body: {
        email: data.email,
        redirectTo: '/sample/auth/reset-password', // リセットページURL
      },
      headers: await headers(),
    });

    console.log(
      '🔑 Password reset request result:',
      result ? 'Success' : 'Failed',
    );

    // セキュリティ: 存在しないメールアドレスでも成功レスポンスを返す
    return { success: true };
  } catch (error: unknown) {
    console.error('🔑 Password reset request error:', error);

    // セキュリティ: エラー詳細を隠してアカウント列挙攻撃を防ぐ
    return { success: true };
  }
}

export async function resetPassword(data: {
  token: string;
  newPassword: string;
}) {
  console.log('🔑 Executing password reset with token');

  try {
    const result = await auth.api.resetPassword({
      body: {
        newPassword: data.newPassword,
        token: data.token,
      },
      headers: await headers(),
    });

    console.log(
      '🔑 Password reset execution result:',
      result ? 'Success' : 'Failed',
    );

    if (!result) {
      throw new Error('パスワードのリセットに失敗しました');
    }

    return result;
  } catch (error: unknown) {
    if (isBetterAuthError(error)) {
      console.error('🔑 Password reset execution error:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
      });

      // エラーメッセージの詳細化
      if (error.status === 'BAD_REQUEST' || error.statusCode === 400) {
        if (
          error.message?.includes('expired') ||
          error.message?.includes('invalid')
        ) {
          throw new Error(
            'リセットリンクの有効期限が切れているか、無効です。新しいリセットリンクを要求してください。',
          );
        }
      }

      throw new Error(
        'パスワードのリセットに失敗しました。リセットリンクを確認してください。',
      );
    } else {
      console.error('🔑 Password reset execution error:', error);
      throw new Error(
        'パスワードのリセットに失敗しました。リセットリンクを確認してください。',
      );
    }
  }
}
