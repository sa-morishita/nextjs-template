'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import type { Diary } from '@/db/schema';

interface DiaryItemProps {
  diary: Diary;
  onClick: () => void;
}

export function DiaryItem({ diary, onClick }: DiaryItemProps) {
  const displayTitle =
    diary.title ||
    (diary.createdAt
      ? format(new Date(diary.createdAt), 'yyyy年MM月dd日', { locale: ja })
      : '無題の日記');
  const preview =
    diary.content.slice(0, 100) + (diary.content.length > 100 ? '...' : '');

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="line-clamp-1 font-semibold">{displayTitle}</h3>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {preview}
          </p>
          {diary.createdAt && (
            <p className="text-muted-foreground text-xs">
              {format(new Date(diary.createdAt), 'yyyy/MM/dd HH:mm', {
                locale: ja,
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
