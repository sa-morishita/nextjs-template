import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';
import { DynamicUserInfo } from './_containers/dynamic-user-info';

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
