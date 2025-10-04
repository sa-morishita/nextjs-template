'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import {
  createTodoFormSchema,
  updateTodoFormSchema,
} from '@/lib/sample/schemas/todos';
import {
  createTodoUsecase,
  updateTodoUsecase,
} from '@/lib/sample/usecases/todos';
import { CACHE_TAGS } from '@/lib/utils/cache-tags';
import { privateActionClient } from '@/lib/utils/safe-action';

export const createTodoAction = privateActionClient
  .metadata({ actionName: 'createTodo' })
  .inputSchema(createTodoFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    await createTodoUsecase(parsedInput, { userId });

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });

export const updateTodoAction = privateActionClient
  .metadata({ actionName: 'updateTodo' })
  .inputSchema(updateTodoFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;

    await updateTodoUsecase(parsedInput, { userId });

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });

export const toggleTodoAction = privateActionClient
  .metadata({ actionName: 'toggleTodo' })
  .bindArgsSchemas<[todoId: z.ZodString]>([
    z.string().min(1, 'TODO IDが不正です'),
  ])
  .inputSchema(z.object({ completed: z.boolean() }))
  .action(async ({ parsedInput, bindArgsParsedInputs: [todoId], ctx }) => {
    const { userId } = ctx;

    await updateTodoUsecase(
      { id: todoId, completed: parsedInput.completed },
      { userId },
    );

    revalidateTag(CACHE_TAGS.TODOS.USER(userId));
  });
