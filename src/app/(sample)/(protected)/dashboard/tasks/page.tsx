import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskFormContainer } from './_containers/task-form';

// 認証が必要なページは動的レンダリング
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'タスク登録 | TODOアプリ',
  description: '新しいタスクを登録します',
};

export default function TasksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-bold text-3xl">タスク登録</h1>
          <p className="mt-2 text-muted-foreground">
            新しいタスクを追加して、効率的に管理しましょう
          </p>
        </div>

        <Suspense fallback={<TaskFormSkeleton />}>
          <TaskFormContainer />
        </Suspense>
      </div>
    </div>
  );
}

function TaskFormSkeleton() {
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
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
