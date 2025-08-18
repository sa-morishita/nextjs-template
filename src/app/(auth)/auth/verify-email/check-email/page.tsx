'use client';

import { CheckCircle, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { resendVerificationEmailAction } from '@/lib/actions/auth';

/**
 * メール送信完了ページ
 *
 * サインアップ後にユーザーに明確に次のステップを伝える
 * トーストよりも分かりやすい専用ページ
 */
export default function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const searchParams = useSearchParams();

  // サインアップ時に使用したメールアドレスを取得（URLパラメータから）
  const email = searchParams.get('email') || '';

  const handleResend = async () => {
    if (!email) {
      toast.error(
        'メールアドレスが見つかりません。もう一度サインアップしてください。',
      );
      return;
    }

    if (resendCount >= 3) {
      toast.error(
        '再送信の上限に達しました。しばらく待ってから再度お試しください。',
      );
      return;
    }

    setIsResending(true);

    try {
      await resendVerificationEmailAction({ email });
      toast.success(
        '認証メールを再送信しました。メールボックスをご確認ください。',
      );
      setResendCount((prev) => prev + 1);
    } catch (_error) {
      toast.error(
        'メールの再送信に失敗しました。しばらく待ってから再度お試しください。',
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">認証メールを送信しました</CardTitle>
            <CardDescription>メールを確認してください</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-3 rounded-lg bg-blue-50 p-4">
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="text-blue-700 text-xs">
                  メールに書かれている認証リンクをクリックしてアカウントを有効化してください
                </p>
              </div>
            </div>

            <div className="space-y-3 text-muted-foreground text-sm">
              <p>
                <strong>次のステップ:</strong>
              </p>
              <ol className="space-y-1 text-left">
                <li>1. メールボックスを確認</li>
                <li>2. 認証リンクをクリック</li>
                <li>3. アカウントが有効化されます</li>
                <li>4. ダッシュボードへ自動的に移動</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isResending || resendCount >= 3 || !email}
                onClick={handleResend}
                title={
                  resendCount >= 3
                    ? '再送信の上限に達しました'
                    : !email
                      ? 'メールアドレスが見つかりません'
                      : undefined
                }
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isResending ? 'animate-spin' : ''}`}
                />
                {isResending
                  ? '送信中...'
                  : resendCount > 0
                    ? `再送信する (残り${3 - resendCount}回)`
                    : 'メールが届かない場合は再送信'}
              </Button>

              <div className="text-muted-foreground text-xs">
                メールが見つからない場合は迷惑メールフォルダもご確認ください
              </div>
            </div>

            <div className="border-t pt-4">
              <Link
                href="/sample/auth/login"
                className="text-primary text-sm hover:underline"
              >
                ← ログインページに戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
