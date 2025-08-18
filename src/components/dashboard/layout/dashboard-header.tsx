import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';
import { DynamicUserInfo } from './_containers/dynamic-user-info';

/**
 * Dashboard Header Component
 *
 * ベストプラクティス: Streaming SSR対応のヘッダーコンポーネント
 * 静的な部分（ナビゲーション）と動的な部分（ユーザー情報）を分離し、
 * TTFBを改善しつつ、パーソナライズされた体験を提供。
 */
export function DashboardHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/mypage" className="font-semibold text-xl">
              TODO App
            </Link>
            <nav className="hidden gap-2 md:flex">
              <Link
                href="/dashboard/mypage"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                マイページ
              </Link>
              <Link
                href="/dashboard/tasks"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                タスク登録
              </Link>
              <Link
                href="/dashboard/diary"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                日記登録
              </Link>
            </nav>
          </div>

          {/* Dynamic部分のプレースホルダー */}
          <Suspense fallback={<UserInfoSkeleton />}>
            <DynamicUserInfo />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/**
 * User Info Skeleton
 *
 * ベストプラクティス: 適切なスケルトンUIでLayout Shiftを防ぐ
 * 実際のコンテンツと同じ高さ・幅を持つことでCLSを最小化。
 */
function UserInfoSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
