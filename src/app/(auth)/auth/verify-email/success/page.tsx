import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

/**
 * メール認証成功ページ
 *
 * Better Auth の認証が成功した後にリダイレクトされるページ
 * autoSignInAfterVerification: true の場合、自動的にログインが完了している
 */
export default function VerifyEmailSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />

        <h1 className="mb-4 font-bold text-3xl text-gray-900">認証完了！</h1>

        <p className="mb-6 text-gray-600">
          メールアドレスの認証が正常に完了しました。
          <br />
          アカウントが有効化され、すべての機能をご利用いただけます。
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard/mypage"
            className={cn(buttonVariants(), 'w-full')}
          >
            ダッシュボードへ
          </Link>

          <p className="text-gray-500 text-sm">TODO App へようこそ！</p>
        </div>
      </div>
    </div>
  );
}
