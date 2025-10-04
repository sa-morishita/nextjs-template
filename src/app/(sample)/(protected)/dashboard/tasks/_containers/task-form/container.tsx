/**
 * TaskForm Container Component
 *
 * セッションを確認してユーザーIDを取得し、
 * 未完了タスク数を取得してPresentational Componentに渡す
 */
import { getSession } from '@/lib/services/auth';
import { getPendingTodoCountUsecase } from '@/lib/usecases/todos';
import { TaskFormPresentational } from './presentational';

export async function TaskFormContainer() {
  const session = await getSession();

  const pendingCount = await getPendingTodoCountUsecase({
    userId: session.user.id,
  });

  return <TaskFormPresentational pendingCount={pendingCount} />;
}
