import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DiaryFormContainer } from './_containers/diary-form';

// 認証が必要なページは動的レンダリング
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '日記作成 | 日記アプリ',
  description: '今日の出来事を記録しましょう',
};

export default function DiaryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-bold text-3xl">日記作成</h1>
          <p className="mt-2 text-muted-foreground">
            今日の出来事や思い出を記録しましょう
          </p>
        </div>

        <Suspense fallback={<DiaryFormSkeleton />}>
          <DiaryFormContainer />
        </Suspense>
      </div>
    </div>
  );
}

function DiaryFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
