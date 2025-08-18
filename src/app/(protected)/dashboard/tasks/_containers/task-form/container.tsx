/**
 * TaskForm Container Component
 *
 * セッションを確認してユーザーIDを取得し、
 * 未完了タスク数を取得してPresentational Componentに渡す
 */
import { getPendingTodoCount } from '@/lib/queries/todos';
import { getSession } from '@/lib/services/auth';
import { TaskFormPresentational } from './presentational';

export async function TaskFormContainer() {
  const session = await getSession();

  const pendingCount = await getPendingTodoCount(session.user.id);

  return <TaskFormPresentational pendingCount={pendingCount} />;
}
