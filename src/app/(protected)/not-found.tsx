import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription className="text-lg">
            お探しのページが見つかりませんでした
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            URLが正しいか確認するか、ホームページに戻ってください。
          </p>
          <Link href="/dashboard/mypage" className={cn(buttonVariants())}>
            ダッシュボードに戻る
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
