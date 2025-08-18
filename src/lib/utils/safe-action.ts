import * as Sentry from '@sentry/nextjs';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { getSession } from '@/lib/services/auth';
import { translateError } from './error-translator';

// 一般的なアクションクライアント
export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  handleServerError(error, utils) {
    const { clientInput, metadata, ctx, bindArgsClientInputs } = utils;
    Sentry.captureException(error, (scope) => {
      scope.clear();
      scope.setContext('serverError', { message: error.message });
      scope.setContext('metadata', { actionName: metadata?.actionName ?? '' });
      scope.setContext('ctx', { ...ctx });
      scope.setContext('clientInput', { clientInput: clientInput ?? {} });
      scope.setContext('bindArgsClientInputs', {
        bindArgsClientInputs: bindArgsClientInputs ?? [],
      });
      if (error.cause) {
        scope.setContext('cause', { ...error.cause });
      }
      return scope;
    });
    console.error('[SAFE-ACTION-ERROR]', error);
    return translateError(error);
  },
});

// 認証が必要なアクションクライアント
export const privateActionClient = actionClient.use(async ({ next }) => {
  const session = await getSession();

  return next({ ctx: { userId: session.user.id, user: session.user } });
});
