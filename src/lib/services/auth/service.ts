import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './config';
import {
  isBetterAuthError,
  logAuthError,
  translateBetterAuthError,
} from './error-translator';

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export async function signInWithEmail(data: SignInData) {
  try {
    const result = await auth.api.signInEmail({
      body: data,
      headers: await headers(),
    });

    if (!result) {
      throw new Error('ログインに失敗しました');
    }

    return result;
  } catch (error: unknown) {
    logAuthError('sign-in', error);

    if (isBetterAuthError(error)) {
      translateBetterAuthError(error, {
        defaultMessage:
          'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
        rules: [
          {
            match: ({ message, error: authError }) =>
              (authError.status === 'FORBIDDEN' ||
                authError.statusCode === 403) &&
              message.toLowerCase().includes('email not verified'),
            translatedMessage:
              'メールアドレスが認証されていません。受信したメールから認証を完了してください。',
          },
          {
            match: ({ message }) =>
              message.toLowerCase().includes('invalid credentials'),
            translatedMessage:
              'メールアドレスまたはパスワードが正しくありません。',
          },
          {
            match: ({ message }) =>
              message.toLowerCase().includes('user not found'),
            translatedMessage:
              'このメールアドレスで登録されたアカウントが見つかりません。',
          },
        ],
      });
    }

    throw new Error(
      'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
    );
  }
}

export async function signUpWithEmail(data: SignUpData) {
  const result = await auth.api.signUpEmail({
    body: data,
    headers: await headers(),
  });

  if (!result) {
    throw new Error('ユーザー登録に失敗しました');
  }

  return result;
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });
}

async function clearSessionCookies() {
  const cookieStore = await cookies();

  const cookieNames = [
    'better-auth.session_token',
    'session_token',
    '__Secure-better-auth.session_token',
    '__Host-better-auth.session_token',
  ];

  for (const cookieName of cookieNames) {
    try {
      cookieStore.delete(cookieName);
    } catch {
      // 削除エラーは無視
    }
  }
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    await clearSessionCookies();
    redirect('/auth/login');
  }

  return session;
}

export async function resendVerificationEmail(data: { email: string }) {
  const result = await auth.api.sendVerificationEmail({
    body: {
      email: data.email,
      callbackURL: '/',
    },
    headers: await headers(),
  });

  if (!result) {
    throw new Error('認証メールの再送信に失敗しました');
  }

  return result;
}

export async function requestPasswordReset(data: { email: string }) {
  try {
    const result = await auth.api.forgetPassword({
      body: {
        email: data.email,
        redirectTo: '/auth/reset-password',
      },
      headers: await headers(),
    });

    return result ? { success: true } : { success: false };
  } catch (error: unknown) {
    logAuthError('password-reset-request', error);
    return { success: true };
  }
}

export async function resetPassword(data: {
  token: string;
  newPassword: string;
}) {
  try {
    const result = await auth.api.resetPassword({
      body: {
        newPassword: data.newPassword,
        token: data.token,
      },
      headers: await headers(),
    });

    if (!result) {
      throw new Error('パスワードのリセットに失敗しました');
    }

    return result;
  } catch (error: unknown) {
    logAuthError('password-reset', error);

    if (isBetterAuthError(error)) {
      translateBetterAuthError(error, {
        defaultMessage:
          'パスワードのリセットに失敗しました。リセットリンクを確認してください。',
        rules: [
          {
            match: ({ message, error: authError }) =>
              (authError.status === 'BAD_REQUEST' ||
                authError.statusCode === 400) &&
              (message.toLowerCase().includes('expired') ||
                message.toLowerCase().includes('invalid')),
            translatedMessage:
              'リセットリンクの有効期限が切れているか、無効です。新しいリセットリンクを要求してください。',
          },
        ],
      });
    }

    throw new Error(
      'パスワードのリセットに失敗しました。リセットリンクを確認してください。',
    );
  }
}
