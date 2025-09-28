import 'server-only';
import { render } from '@react-email/components';
import { Resend } from 'resend';
import { env } from '@/app/env.mjs';
import {
  EmailVerificationTemplate,
  PasswordResetTemplate,
} from '@/lib/utils/email-templates/auth';

export const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmailWithReact(params: {
  to: string;
  userName?: string;
  verificationUrl: string;
  companyName?: string;
}) {
  try {
    console.log('📧 Sending React Email verification to:', params.to);

    const html = await render(
      EmailVerificationTemplate({
        userName: params.userName,
        verificationUrl: params.verificationUrl,
        companyName: params.companyName,
      }),
    );

    const text = await render(
      EmailVerificationTemplate({
        userName: params.userName,
        verificationUrl: params.verificationUrl,
        companyName: params.companyName,
      }),
      { plainText: true },
    );

    const result = await resend.emails.send({
      from: 'noreply@mail.q-3.jp', // 検証済みドメイン
      to: params.to,
      subject: `メールアドレスを認証してください - ${params.companyName || 'TODO App'}`,
      html,
      text,
    });

    console.log('📧 Resend API response:', {
      id: result.data?.id,
      error: result.error,
      data: result.data,
    });

    if (result.error) {
      console.error('📧 Resend API error:', result.error);
      throw new Error(
        `Resend APIエラー: ${result.error.message || 'Unknown error'}`,
      );
    }

    if (!result.data?.id) {
      console.error('📧 No email ID returned from Resend');
      throw new Error('メールの送信に失敗しました（IDが返されませんでした）');
    }

    console.log(
      '📧 React Email verification sent successfully:',
      result.data.id,
    );
    return result;
  } catch (error) {
    console.error('📧 Failed to send React Email verification:', error);
    throw new Error('認証メールの送信に失敗しました');
  }
}

export async function sendPasswordResetEmailWithReact(params: {
  to: string;
  userName?: string;
  resetUrl: string;
  companyName?: string;
}) {
  try {
    console.log('📧 Sending React Email password reset to:', params.to);

    const html = await render(
      PasswordResetTemplate({
        userName: params.userName,
        resetUrl: params.resetUrl,
        companyName: params.companyName,
      }),
    );

    const text = await render(
      PasswordResetTemplate({
        userName: params.userName,
        resetUrl: params.resetUrl,
        companyName: params.companyName,
      }),
      { plainText: true },
    );

    const result = await resend.emails.send({
      from: 'noreply@mail.q-3.jp', // 検証済みドメイン
      to: params.to,
      subject: `パスワードリセット - ${params.companyName || 'TODO App'}`,
      html,
      text,
    });

    console.log('📧 Resend API response:', {
      id: result.data?.id,
      error: result.error,
      data: result.data,
    });

    if (result.error) {
      console.error('📧 Resend API error:', result.error);
      throw new Error(
        `Resend APIエラー: ${result.error.message || 'Unknown error'}`,
      );
    }

    if (!result.data?.id) {
      console.error('📧 No email ID returned from Resend');
      throw new Error('メールの送信に失敗しました（IDが返されませんでした）');
    }

    console.log(
      '📧 React Email password reset sent successfully:',
      result.data.id,
    );
    return result;
  } catch (error) {
    console.error('📧 Failed to send React Email password reset:', error);
    throw new Error('パスワードリセットメールの送信に失敗しました');
  }
}
