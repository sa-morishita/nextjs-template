'use client';

import * as Sentry from '@sentry/nextjs';
import { AlertCircleIcon, HomeIcon, RefreshCwIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils/date';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-destructive/5 px-4">
      <div className="w-full max-w-lg text-center">
        {/* エラーアイコン */}
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-6">
              <AlertCircleIcon className="h-16 w-16 text-destructive" />
            </div>
          </div>
        </div>

        {/* メッセージ */}
        <div className="mb-8 space-y-4">
          <h1 className="font-semibold text-2xl text-foreground">
            申し訳ございません
          </h1>
          <div className="space-y-2">
            <h2 className="font-medium text-lg text-muted-foreground">
              予期しないエラーが発生しました
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              システムに一時的な問題が発生している可能性があります。
              <br />
              しばらく時間をおいてから再度お試しください。
            </p>
          </div>
        </div>

        {/* エラーID（本番環境では非表示にすることも可能） */}
        {error.digest && (
          <div className="mb-6 rounded-lg bg-muted/50 p-3">
            <p className="text-muted-foreground text-xs">エラーID</p>
            <p className="break-all font-mono text-foreground text-sm">
              {error.digest}
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            size="lg"
            className="inline-flex items-center gap-2 shadow-sm"
          >
            <RefreshCwIcon className="h-4 w-4" />
            もう一度試す
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/auth/login')}
            className="inline-flex items-center gap-2 shadow-sm"
          >
            <HomeIcon className="h-4 w-4" />
            ホームに戻る
          </Button>
        </div>

        {/* サポート情報 */}
        <div className="mt-8 space-y-1 text-muted-foreground text-xs">
          <p>
            問題が続く場合は、下記の情報と共にサポートまでお問い合わせください
          </p>
          <p className="font-mono">{formatDateTime(new Date())}</p>
        </div>
      </div>
    </div>
  );
}
