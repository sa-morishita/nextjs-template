/**
 * TaskForm Component (Client Component)
 *
 * タスク登録フォーム
 * Container/Presentationalパターンにおける末端のClient Component
 */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { useId } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createTodoAction } from '@/lib/actions/todos';
import { TODO_MESSAGES } from '@/lib/domain/todos';
import { createTodoFormSchema } from '@/lib/schemas';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';

export function TaskForm() {
  const titleInputId = useId();

  const { form, handleSubmitWithAction } = useHookFormAction(
    createTodoAction,
    zodResolver(createTodoFormSchema),
    {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          title: '',
        },
      },
      actionProps: {
        onSuccess: () => {
          form.reset();
          toast.success(TODO_MESSAGES.CREATION_SUCCESS);
        },
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            TODO_MESSAGES.CREATION_ERROR,
          );
          toast.error(message);
        },
      },
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={titleInputId}>タスクのタイトル</FormLabel>
              <FormControl>
                <Input
                  id={titleInputId}
                  placeholder="例: プレゼン資料の作成"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                取り組むタスクの内容を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? '追加中...' : 'タスクを追加'}
        </Button>
      </form>
    </Form>
  );
}
