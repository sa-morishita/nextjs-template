'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
          <div className="w-full max-w-lg space-y-6 text-center">
            {/* エラーアイコンと500番号 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-6">
                  <svg
                    className="h-16 w-16 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="font-bold text-8xl text-red-200">500</h1>
            </div>

            {/* メッセージ */}
            <div className="space-y-3">
              <h2 className="font-semibold text-2xl text-gray-900">
                重大なシステムエラー
              </h2>
              <p className="text-gray-600 leading-relaxed">
                申し訳ございません。システムに深刻な問題が発生しました。
                <br />
                技術チームに自動で報告されています。しばらく時間をおいてから再度お試しください。
              </p>
            </div>

            {/* 開発環境でのみエラー詳細を表示 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg bg-gray-100 p-4 text-left">
                <p className="mb-2 text-gray-500 text-xs">開発環境のみ表示</p>
                <p className="break-all font-mono text-gray-700 text-xs">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-1 font-mono text-gray-500 text-xs">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                アプリケーションを再起動
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                ホームに戻る
              </button>
            </div>

            {/* サポート情報 */}
            <div className="space-y-1 text-gray-500 text-xs">
              <p>このエラーは自動で記録されています</p>
              <p className="font-mono">{new Date().toISOString()}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
