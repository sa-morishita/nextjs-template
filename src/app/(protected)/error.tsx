'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[50vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">
            エラーが発生しました
          </CardTitle>
          <CardDescription>
            申し訳ございません。予期しないエラーが発生しました。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3">
              <p className="font-mono text-sm">{error.message}</p>
              {error.digest && (
                <p className="mt-1 text-muted-foreground text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <Button onClick={reset} variant="default" className="w-full">
            もう一度試す
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
