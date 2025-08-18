'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createTodoFormSchema, updateTodoFormSchema } from '@/lib/schemas';
import { createTodoUsecase, updateTodoUsecase } from '@/lib/usecases/todos';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';
import { privateActionClient } from '@/lib/utils/safe-action';

export const createTodoAction = privateActionClient
  .metadata({ actionName: 'createTodo' })
  .inputSchema(createTodoFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し（ビジネスロジックはUsecaseに委譲）
    await createTodoUsecase(parsedInput, { userId });

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });

export const updateTodoAction = privateActionClient
  .metadata({ actionName: 'updateTodo' })
  .inputSchema(updateTodoFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し（ビジネスロジックはUsecaseに委譲）
    await updateTodoUsecase(parsedInput, { userId });

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });

// toggleTodoAction: IDをバインドして完了状態を切り替える専用のアクション
export const toggleTodoAction = privateActionClient
  .metadata({ actionName: 'toggleTodo' })
  .bindArgsSchemas<[todoId: z.ZodString]>([
    z.string().min(1, 'TODO IDが不正です'),
  ])
  .inputSchema(z.object({ completed: z.boolean() }))
  .action(async ({ parsedInput, bindArgsParsedInputs: [todoId], ctx }) => {
    const { userId } = ctx;

    // Usecaseを呼び出し
    await updateTodoUsecase(
      { id: todoId, completed: parsedInput.completed },
      { userId },
    );

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });
