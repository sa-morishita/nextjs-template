import { LoaderIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* メインローディングアイコン */}
        <div className="flex justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </div>

        {/* ローディングメッセージ */}
        <div className="text-center">
          <h2 className="font-medium text-foreground text-lg">読み込み中...</h2>
          <p className="text-muted-foreground text-sm">
            しばらくお待ちください
          </p>
        </div>

        {/* コンテンツスケルトン */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
