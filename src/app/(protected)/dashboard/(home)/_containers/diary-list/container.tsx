import { getSession } from '@/lib/services/auth';
import { getDiaryListUsecase } from '@/lib/usecases/diary';
import { parseDateFromQueryParam } from '@/lib/utils/date';
import { DiaryListPresentational } from './presentational';

export async function DiaryListContainer({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const params = await searchParams;

  const rawSearch = params.search;
  const searchQueryCandidate = Array.isArray(rawSearch)
    ? rawSearch[0]
    : rawSearch;
  const searchQuery = searchQueryCandidate?.trim();
  const normalizedSearchQuery =
    searchQuery && searchQuery.length > 0 ? searchQuery : undefined;

  const filters = {
    searchQuery: normalizedSearchQuery,
    dateFrom: parseDateFromQueryParam(params.dateFrom) ?? undefined,
    dateTo: parseDateFromQueryParam(params.dateTo) ?? undefined,
  };

  const diaries = await getDiaryListUsecase(filters, {
    userId: session.user.id,
  });

  return <DiaryListPresentational diaries={diaries} />;
}
