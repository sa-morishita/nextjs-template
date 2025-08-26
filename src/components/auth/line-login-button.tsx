'use client';

import * as Sentry from '@sentry/nextjs';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { signIn } from '@/lib/services/auth/client';

interface LineLoginButtonProps {
  redirectTo?: string;
  className?: string;
}

export function LineLoginButton({
  redirectTo = '/dashboard',
  className = '',
}: LineLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLineLogin = async () => {
    try {
      setIsLoading(true);
      await signIn.social({
        provider: 'line',
        callbackURL: redirectTo,
      });
    } catch (error) {
      console.error('LINE認証エラー:', error);

      // Sentryにエラーを送信
      Sentry.captureException(error, {
        tags: {
          service: 'line-auth',
          component: 'LineLoginButton',
        },
        extra: {
          redirectTo,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLineLogin}
      disabled={isLoading}
      aria-label="LINEでログイン"
      className={`relative inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#06C755] focus:ring-offset-2 ${
        isLoading
          ? 'cursor-wait bg-[#06C755] text-white'
          : 'group bg-[#06C755] text-white hover:shadow-[inset_0_0_0_100px_rgba(0,0,0,0.1)] active:shadow-[inset_0_0_0_100px_rgba(0,0,0,0.3)]'
      } disabled:cursor-not-allowed disabled:border disabled:border-[#E5E5E5] disabled:bg-white disabled:text-[#1E1E1E]/20 disabled:active:shadow-none disabled:hover:shadow-none ${className} `}
      style={{
        minHeight: '44px',
        minWidth: '152px',
      }}
    >
      <div className="flex items-center justify-center">
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-3">認証中...</span>
          </>
        ) : (
          <>
            {/* LINE公式アイコン from Simple Icons - viewBox: 0 0 24 24 */}
            <svg
              className="h-5 w-5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>

            {/* 縦線 - 黒8% */}
            <div className="mx-3 h-6 w-px bg-black/[0.08] group-disabled:bg-[#E5E5E5]" />

            <span>LINEでログイン</span>
          </>
        )}
      </div>
    </button>
  );
}
