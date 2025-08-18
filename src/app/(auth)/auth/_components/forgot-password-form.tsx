'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { CheckCircle } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { forgotPasswordAction } from '@/lib/actions/auth';
import { AUTH_MESSAGES } from '@/lib/domain/auth';
import { forgotPasswordSchema } from '@/lib/schemas';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const emailInputId = useId();

  const { form, action, handleSubmitWithAction, resetFormAndAction } =
    useHookFormAction(forgotPasswordAction, zodResolver(forgotPasswordSchema), {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          email: '',
        },
      },
      actionProps: {
        onSuccess: () => {
          toast.success(AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT);
          setIsSubmitted(true);
          resetFormAndAction();
        },
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            AUTH_MESSAGES.PASSWORD_RESET_ERROR,
          );
          toast.error(message);
        },
      },
    });

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">メールを送信しました</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            パスワードリセット用のリンクをメールアドレスに送信しました。
            メールボックスをご確認ください。
          </p>
        </div>
        <div className="text-muted-foreground text-xs">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSubmitted(false)}
        >
          別のメールアドレスで再送信
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmitWithAction}
        className="space-y-4"
        aria-label="Forgot Password Form"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={emailInputId}>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  id={emailInputId}
                  placeholder="メールアドレスを入力"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={action.status === 'executing'}
        >
          {action.status === 'executing'
            ? 'メール送信中...'
            : 'パスワードリセットメールを送信'}
        </Button>
      </form>
    </Form>
  );
}
