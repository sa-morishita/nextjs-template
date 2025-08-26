import { getSession } from '@/lib/services/auth';
import { getDiaryListUsecase } from '@/lib/usecases/diary';
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

  const diaries = await getDiaryListUsecase(filters, {
    userId: session.user.id,
  });

  return <DiaryListPresentational diaries={diaries} />;
}
