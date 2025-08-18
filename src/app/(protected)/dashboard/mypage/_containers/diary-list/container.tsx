import { getUserDiaries } from '@/lib/queries/diaries';
import { getSession } from '@/lib/services/auth';
import { DiaryListPresentational } from './presentational';

export async function DiaryListContainer({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const session = await getSession();
  const params = await searchParams;

  const filters = {
    searchQuery: params.search,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
  };

  const diaries = await getUserDiaries(session.user.id, filters);

  return <DiaryListPresentational diaries={diaries} />;
}
