import { Suspense } from 'react';
import { VerificationMessage } from './_components/verification-message';

/**
 * メール認証ページ
 *
 * Better Auth のメール認証フローで使用
 * ユーザーがメール内のリンクをクリックした後に表示
 */
export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-2xl text-gray-900">メール認証</h1>
          <p className="mt-2 text-gray-600">認証を完了しています...</p>
        </div>

        <Suspense fallback={<div className="text-center">認証処理中...</div>}>
          <VerificationMessage />
        </Suspense>
      </div>
    </div>
  );
}
