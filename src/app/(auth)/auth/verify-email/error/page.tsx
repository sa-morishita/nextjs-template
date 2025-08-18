import { Mail, XCircle } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

/**
 * メール認証エラーページ
 *
 * Better Auth の認証でエラーが発生した場合にリダイレクトされるページ
 * トークンの有効期限切れや無効なトークンの場合
 */
export default function VerifyEmailErrorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <XCircle className="mx-auto mb-6 h-20 w-20 text-red-500" />

        <h1 className="mb-4 font-bold text-3xl text-gray-900">認証エラー</h1>

        <p className="mb-6 text-gray-600">
          メール認証に失敗しました。
          <br />
          認証リンクが無効か、有効期限が切れている可能性があります。
        </p>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start">
            <Mail className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-left">
              <h3 className="mb-1 font-medium text-amber-800">解決方法</h3>
              <ul className="space-y-1 text-amber-700 text-sm">
                <li>• 新しい認証メールを要求してください</li>
                <li>• メール内のリンクは24時間で期限切れになります</li>
                <li>• 迷惑メールフォルダもご確認ください</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/sample/auth/signup"
            className={cn(buttonVariants(), 'w-full')}
          >
            新しい認証メールを要求
          </Link>

          <Link
            href="/sample/auth/login"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
          >
            ログインページへ
          </Link>
        </div>

        <p className="mt-6 text-gray-500 text-sm">
          問題が解決しない場合は、サポートまでお問い合わせください。
        </p>
      </div>
    </div>
  );
}
