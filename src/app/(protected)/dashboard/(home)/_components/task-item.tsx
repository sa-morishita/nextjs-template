'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormOptimisticAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Check, X } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import type { Todo } from '@/db/schema';
import { toggleTodoAction } from '@/lib/actions/todos';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';
import { cn } from '@/lib/utils/utils';

interface TaskItemProps {
  todo: Todo;
  todos: Todo[];
}

function TaskItemComponent({ todo, todos }: TaskItemProps) {
  // IDをバインドしたアクションを作成
  const boundToggleTodoAction = toggleTodoAction.bind(null, todo.id);

  // 楽観的更新を使用したアクションの設定
  const { form, action } = useHookFormOptimisticAction(
    boundToggleTodoAction,
    zodResolver(z.object({ completed: z.boolean() })),
    {
      formProps: {
        defaultValues: {
          completed: todo.completed,
        },
      },
      actionProps: {
        currentState: { todos },
        updateFn: (state, input) => ({
          todos: state.todos.map((t) =>
            t.id === todo.id
              ? { ...t, completed: input.completed ?? t.completed }
              : t,
          ),
        }),
        onSuccess: () => {
          toast.success(
            !todo.completed
              ? 'タスクを完了しました'
              : 'タスクを未完了にしました',
          );
        },
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            'エラーが発生しました',
          );
          toast.error(message);
        },
      },
    },
  );

  // 楽観的状態から現在のTODOを取得
  const optimisticTodo =
    action.optimisticState?.todos.find((t: Todo) => t.id === todo.id) || todo;

  const handleToggle = () => {
    form.setValue('completed', !optimisticTodo.completed);
    form.handleSubmit(action.execute)();
  };

  return (
    <Card
      className={cn('transition-opacity', action.isPending && 'opacity-60')}
    >
      <CardContent className="p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(action.execute)}
            className="flex items-center gap-3"
          >
            <FormField
              control={form.control}
              name="completed"
              render={() => (
                <FormItem>
                  <FormControl>
                    <Button
                      type="button"
                      variant={optimisticTodo.completed ? 'default' : 'outline'}
                      size="icon"
                      onClick={handleToggle}
                      disabled={action.isPending}
                      aria-label={
                        optimisticTodo.completed ? '未完了にする' : '完了にする'
                      }
                    >
                      {optimisticTodo.completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            <h3
              className={cn(
                'flex-1 font-medium',
                optimisticTodo.completed &&
                  'text-muted-foreground line-through',
              )}
            >
              {optimisticTodo.title}
            </h3>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// React.memoでラップしてエクスポート
export const TaskItem = React.memo(
  TaskItemComponent,
  (prevProps, nextProps) => {
    // todoの内容が変わらなければ再レンダリングをスキップ
    return (
      prevProps.todo.id === nextProps.todo.id &&
      prevProps.todo.completed === nextProps.todo.completed &&
      prevProps.todo.title === nextProps.todo.title &&
      prevProps.todo.updatedAt === nextProps.todo.updatedAt
    );
  },
);
