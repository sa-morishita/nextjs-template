'use client';

import React from 'react';
import type { Todo } from '@/db/schema';
import { TaskItem } from '../../_components/task-item';

interface TaskListPresentationalProps {
  todos: Todo[];
}

function TaskListPresentationalComponent({
  todos,
}: TaskListPresentationalProps) {
  if (todos.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        タスクがありません
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TaskItem key={todo.id} todo={todo} todos={todos} />
      ))}
    </div>
  );
}

// React.memoでラップしてエクスポート
export const TaskListPresentational = React.memo(
  TaskListPresentationalComponent,
);
