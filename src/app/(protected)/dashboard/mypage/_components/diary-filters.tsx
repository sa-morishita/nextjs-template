'use client';

import { Calendar, Search } from 'lucide-react';
import { useQueryState } from 'nuqs';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DiaryFilters() {
  const [isPending, startTransition] = useTransition();
  const searchInputId = useId();
  const dateFromId = useId();
  const dateToId = useId();

  // URL状態管理
  const [search, setSearch] = useQueryState('search', {
    defaultValue: '',
    clearOnDefault: true,
    shallow: false, // Server Componentsの再レンダリングを有効化
    startTransition,
  });

  const [dateFrom, setDateFrom] = useQueryState('dateFrom', {
    defaultValue: '',
    clearOnDefault: true,
    shallow: false, // Server Componentsの再レンダリングを有効化
    startTransition,
  });

  const [dateTo, setDateTo] = useQueryState('dateTo', {
    defaultValue: '',
    clearOnDefault: true,
    shallow: false, // Server Componentsの再レンダリングを有効化
    startTransition,
  });

  // ローカル状態（入力値）
  const [localSearch, setLocalSearch] = useState(search);
  const [isComposing, setIsComposing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // デバウンス処理（500ms）
  const debouncedSetSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setSearch(value);
      }, 500);
    },
    [setSearch],
  );

  // 検索値が外部から変更された場合（URLパラメータ変更など）
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // 日本語変換中でない場合のみデバウンス処理を実行
    if (!isComposing) {
      debouncedSetSearch(value);
    }
  };

  const handleReset = () => {
    // タイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalSearch('');
    startTransition(() => {
      setSearch('');
      setDateFrom('');
      setDateTo('');
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">検索・フィルター</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 検索入力 */}
          <div className="space-y-2">
            <Label htmlFor={searchInputId}>検索</Label>
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id={searchInputId}
                type="search"
                placeholder="日記を検索..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(e) => {
                  setIsComposing(false);
                  // 変換確定時にデバウンス処理を実行
                  debouncedSetSearch(e.currentTarget.value);
                }}
                className="pl-10"
                disabled={isPending}
              />
            </div>
          </div>

          {/* 日付フィルター */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={dateFromId}>開始日</Label>
              <div className="relative">
                <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id={dateFromId}
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-10"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={dateToId}>終了日</Label>
              <div className="relative">
                <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id={dateToId}
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-10"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* リセットボタン */}
          {(search || dateFrom || dateTo) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="w-full"
            >
              フィルターをクリア
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
