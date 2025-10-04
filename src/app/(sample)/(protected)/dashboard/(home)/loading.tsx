import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-8 h-10 w-48" />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* タスクセクション */}
        <section>
          <Skeleton className="mb-4 h-8 w-24" />
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
        </section>

        {/* 日記セクション */}
        <section>
          <Skeleton className="mb-4 h-8 w-24" />
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
        </section>
      </div>
    </div>
  );
}
