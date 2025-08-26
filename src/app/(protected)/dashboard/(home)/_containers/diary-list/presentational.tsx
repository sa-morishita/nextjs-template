'use client';

import { useState } from 'react';
import type { Diary } from '@/db/schema';
import { DiaryDetailDialog } from '../../_components/diary-detail-dialog';
import { DiaryFilters } from '../../_components/diary-filters';
import { DiaryItem } from '../../_components/diary-item';

interface DiaryListPresentationalProps {
  diaries: Diary[];
}

export function DiaryListPresentational({
  diaries,
}: DiaryListPresentationalProps) {
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);

  return (
    <>
      <DiaryFilters />

      {diaries.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          日記がありません
        </div>
      ) : (
        <div className="space-y-3">
          {diaries.map((diary) => (
            <DiaryItem
              key={diary.id}
              diary={diary}
              onClick={() => setSelectedDiary(diary)}
            />
          ))}
        </div>
      )}

      <DiaryDetailDialog
        diary={selectedDiary}
        open={!!selectedDiary}
        onOpenChange={(open) => !open && setSelectedDiary(null)}
      />
    </>
  );
}
