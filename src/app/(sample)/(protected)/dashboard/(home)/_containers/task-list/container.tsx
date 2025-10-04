import { getSession } from '@/lib/services/auth';
import { getTodoListUsecase } from '@/lib/usecases/todos';
import { TaskListPresentational } from './presentational';

export async function TaskListContainer() {
  const session = await getSession();
  const todos = await getTodoListUsecase({ userId: session.user.id });

  return <TaskListPresentational todos={todos} />;
}
