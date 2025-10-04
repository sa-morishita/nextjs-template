'use client';

import { CheckCircle, Mail, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/services/auth/client';

type VerificationState = 'loading' | 'success' | 'error' | 'pending';

/**
 * メール認証メッセージコンポーネント
 *
 * Better Auth の認証フローで使用
 * URLパラメータに基づいて適切なメッセージを表示
 */
export function VerificationMessage() {
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    // エラーパラメータがある場合
    if (error) {
      setState('error');
      setMessage(getErrorMessage(error));
      return;
    }

    // トークンがない場合は認証待ち状態
    if (!token) {
      setState('pending');
      setMessage(
        'メール認証を完了するには、受信したメール内のリンクをクリックしてください。',
      );
      return;
    }

    // トークンがある場合は認証処理を実行
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (_token: string) => {
    try {
      // Better Auth の認証処理は自動的に行われるため、
      // ここではセッション確認のみ実行
      const session = await authClient.getSession();

      if (session.data) {
        setState('success');
        setMessage(
          'メール認証が完了しました。ダッシュボードにリダイレクトします。',
        );

        // 3秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setState('error');
        setMessage('認証に失敗しました。再度お試しください。');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setState('error');
      setMessage('認証処理中にエラーが発生しました。');
    }
  };

  const resendVerification = async () => {
    try {
      // 再送信機能は将来実装
      setMessage(
        '認証メールの再送信機能は準備中です。サポートにお問い合わせください。',
      );
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('再送信に失敗しました。');
    }
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'invalid_token':
        return '認証リンクが無効です。新しい認証メールを要求してください。';
      case 'expired_token':
        return '認証リンクの有効期限が切れています。新しい認証メールを要求してください。';
      case 'already_verified':
        return 'このメールアドレスは既に認証済みです。';
      default:
        return '認証に失敗しました。新しい認証メールを要求してください。';
    }
  };

  const renderIcon = () => {
    switch (state) {
      case 'success':
        return (
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        );
      case 'error':
        return <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />;
      case 'pending':
        return <Mail className="mx-auto mb-4 h-16 w-16 text-blue-500" />;
      default:
        return (
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        );
    }
  };

  const getTitle = () => {
    switch (state) {
      case 'success':
        return '認証完了';
      case 'error':
        return '認証エラー';
      case 'pending':
        return 'メール認証待ち';
      default:
        return '認証処理中';
    }
  };

  const getButtonText = () => {
    switch (state) {
      case 'success':
        return 'ダッシュボードへ';
      case 'error':
        return '認証メールを再送信';
      case 'pending':
        return 'ログインページへ';
      default:
        return null;
    }
  };

  const handleButtonClick = () => {
    switch (state) {
      case 'success':
        router.push('/dashboard');
        break;
      case 'error':
        resendVerification();
        break;
      case 'pending':
        router.push('/auth/login');
        break;
    }
  };

  return (
    <div className="text-center">
      {renderIcon()}

      <h2 className="mb-4 font-semibold text-gray-900 text-xl">{getTitle()}</h2>

      <p className="mb-6 text-gray-600">{message}</p>

      {getButtonText() && (
        <Button
          onClick={handleButtonClick}
          className="w-full"
          variant={state === 'error' ? 'outline' : 'default'}
        >
          {getButtonText()}
        </Button>
      )}

      {state === 'pending' && (
        <p className="mt-4 text-gray-500 text-sm">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
      )}
    </div>
  );
}
