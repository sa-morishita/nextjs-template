import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DiaryListContainer } from './_containers/diary-list';
import { TaskListContainer } from './_containers/task-list';

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 font-bold text-3xl">マイページ</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* タスクセクション */}
        <section>
          <h2 className="mb-4 font-semibold text-2xl">タスク</h2>
          <Suspense fallback={<TaskListSkeleton />}>
            <TaskListContainer />
          </Suspense>
        </section>

        {/* 日記セクション */}
        <section>
          <h2 className="mb-4 font-semibold text-2xl">日記</h2>
          <Suspense fallback={<DiaryListSkeleton />}>
            <DiaryListContainer searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

// スケルトンコンポーネント
function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-6 flex-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DiaryListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
