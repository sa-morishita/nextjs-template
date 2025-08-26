'use server';
import { redirect } from 'next/navigation';
import { flattenValidationErrors } from 'next-safe-action';
import {
  forgotPasswordSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/schemas';
import {
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signUpWithEmail,
} from '@/lib/services/auth';
import { signOutUsecase } from '../usecases/auth';
import { actionClient, privateActionClient } from '../utils/safe-action';

export const signInAction = actionClient
  .metadata({ actionName: 'signin' })
  .inputSchema(signInSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput: { email, password } }) => {
    await signInWithEmail({ email, password });
    redirect('/dashboard');
  });

export const signUpAction = actionClient
  .metadata({ actionName: 'signup' })
  .inputSchema(signUpSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput: { email, password, name } }) => {
    await signUpWithEmail({ email, password, name });
    // メール認証が必要なため、メール確認ページにリダイレクト（メールアドレスを含める）
    redirect(
      `/auth/verify-email/check-email?email=${encodeURIComponent(email)}`,
    );
  });

export const resendVerificationEmailAction = actionClient
  .metadata({ actionName: 'resend-verification-email' })
  .inputSchema(resendVerificationEmailSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput: { email } }) => {
    await resendVerificationEmail({ email });
    return { success: true };
  });

export const forgotPasswordAction = actionClient
  .metadata({ actionName: 'forgot-password' })
  .inputSchema(forgotPasswordSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput: { email } }) => {
    await requestPasswordReset({ email });
    return { success: true };
  });

export const resetPasswordAction = actionClient
  .metadata({ actionName: 'reset-password' })
  .inputSchema(resetPasswordSchema, {
    handleValidationErrorsShape: async (ve) =>
      flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput: { token, password } }) => {
    await resetPassword({ token, newPassword: password });
    redirect('/auth/login?message=password-reset-success');
  });

export const signOutAction = privateActionClient
  .metadata({ actionName: 'signout' })
  .action(async () => {
    await signOutUsecase();
    // UI関連の処理（ログインページリダイレクト）
    redirect('/auth/login');
  });
