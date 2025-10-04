'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authClient } from '@/lib/services/auth/client';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        // Better Authのサインアウトを実行（クッキーをクリア）
        await authClient.signOut();
      } catch (error) {
        console.error('[SignOutPage] Error during signout:', error);
      } finally {
        // エラーが発生してもログインページへリダイレクト
        router.push('/auth/login');
      }
    };

    performSignOut();
  }, [router]);

  // サインアウト処理中の表示
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">ログアウト中...</p>
      </div>
    </div>
  );
}
