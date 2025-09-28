import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './config';

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
    console.error('🔑 Password reset request error:', error);
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
    if (isBetterAuthError(error)) {
      console.error('🔑 Password reset execution error:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
      });

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
