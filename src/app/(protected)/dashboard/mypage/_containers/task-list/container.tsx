import { getTodosByUserId } from '@/lib/queries/todos';
import { getSession } from '@/lib/services/auth';
import { TaskListPresentational } from './presentational';

export async function TaskListContainer() {
  const session = await getSession();
  const todos = await getTodosByUserId(session.user.id);

  return <TaskListPresentational todos={todos} />;
}
