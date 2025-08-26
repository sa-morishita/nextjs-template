'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Diary } from '@/db/schema';
import { formatDate, formatDateTime } from '@/lib/utils/date';

interface DiaryDetailDialogProps {
  diary: Diary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiaryDetailDialog({
  diary,
  open,
  onOpenChange,
}: DiaryDetailDialogProps) {
  if (!diary) return null;

  const displayTitle =
    diary.title ||
    (diary.createdAt ? formatDate(diary.createdAt) : '無題の日記');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{displayTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {diary.createdAt && (
            <p className="text-muted-foreground text-sm">
              {formatDateTime(diary.createdAt)}
            </p>
          )}

          {diary.imageUrl && (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <Image
                src={diary.imageUrl}
                alt="日記の画像"
                placeholder={diary.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={diary.blurDataUrl || undefined}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          <div className="whitespace-pre-wrap break-words">{diary.content}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
