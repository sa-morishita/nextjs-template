/**
 * DiaryForm Presentational Component (Server Component)
 *
 * Container/Presentationalパターンにおける表示層
 * Server Componentとして実装し、Client Componentは子要素として配置
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DiaryForm } from '../../_components/diary-form';

interface DiaryFormPresentationalProps {
  hasTodaysDiary: boolean;
}

export function DiaryFormPresentational({
  hasTodaysDiary,
}: DiaryFormPresentationalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>今日の日記</CardTitle>
        <CardDescription>
          {hasTodaysDiary
            ? '本日の日記は既に作成されています'
            : '今日の出来事を記録しましょう'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DiaryForm hasTodaysDiary={hasTodaysDiary} />
      </CardContent>
    </Card>
  );
}
