'use client';

import { Calendar, Search } from 'lucide-react';
import { debounce, useQueryState } from 'nuqs';
import { useId, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DiaryFilters() {
  const [isPending, startTransition] = useTransition();
  const searchInputId = useId();
  const dateFromId = useId();
  const dateToId = useId();

  const [search, setSearch] = useQueryState('search', {
    defaultValue: '',
    clearOnDefault: true,
    shallow: false,
    startTransition,
  });

  const [dateFrom, setDateFrom] = useQueryState('dateFrom', {
    defaultValue: '',
    clearOnDefault: true,
    shallow: false,
    startTransition,
  });

  const [dateTo, setDateTo] = useQueryState('dateTo', {
    defaultValue: '',
    clearOnDefault: true,
    shallow: false,
    startTransition,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value, {
      limitUrlUpdates: value === '' ? undefined : debounce(400),
    });
  };

  const handleReset = () => {
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
          <div className="space-y-2">
            <Label htmlFor={searchInputId}>検索</Label>
            <div className="relative">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                id={searchInputId}
                type="search"
                placeholder="日記を検索..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                disabled={isPending}
              />
            </div>
          </div>

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
