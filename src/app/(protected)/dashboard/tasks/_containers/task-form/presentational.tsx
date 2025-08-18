/**
 * TaskForm Presentational Component (Server Component)
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
import { TaskForm } from '../../_components/task-form';

interface TaskFormPresentationalProps {
  pendingCount: number;
}

export function TaskFormPresentational({
  pendingCount,
}: TaskFormPresentationalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>新規タスク</CardTitle>
        <CardDescription>
          現在 {pendingCount} 件の未完了タスクがあります
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TaskForm />
      </CardContent>
    </Card>
  );
}
