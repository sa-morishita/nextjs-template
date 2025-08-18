'use client';

import { ArrowLeftIcon, HomeIcon, MapIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
      <div className="w-full max-w-lg text-center">
        {/* 404 アイコンと数字 */}
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted/50 p-6">
              <MapIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
          <h1 className="font-bold text-8xl text-foreground/20">404</h1>
        </div>

        {/* メッセージ */}
        <div className="mb-8 space-y-3">
          <h2 className="font-semibold text-2xl text-foreground">
            おっと！ページが見つかりません
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            お探しのページは移動または削除された可能性があります。
            <br />
            URLをもう一度ご確認いただくか、下記のボタンからお進みください。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'inline-flex items-center gap-2 shadow-sm',
            )}
          >
            <HomeIcon className="h-4 w-4" />
            ホームに戻る
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 shadow-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            前のページに戻る
          </Button>
        </div>

        {/* 追加情報 */}
        <div className="mt-8 text-muted-foreground text-xs">
          このエラーが続く場合は、サポートまでお問い合わせください
        </div>
      </div>
    </div>
  );
}
