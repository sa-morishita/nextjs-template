'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Eye, EyeOff } from 'lucide-react';
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
import { signUpAction } from '@/lib/actions/auth';
import { AUTH_MESSAGES } from '@/lib/domain/auth';
import { signUpSchema } from '@/lib/schemas';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const emailInputId = useId();
  const nameInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  const { form, action, handleSubmitWithAction } = useHookFormAction(
    signUpAction,
    zodResolver(signUpSchema),
    {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          email: '',
          name: '',
          password: '',
          confirmPassword: '',
        },
      },
      actionProps: {
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            AUTH_MESSAGES.SIGNUP_ERROR,
          );
          toast.error(message);
        },
      },
    },
  );

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmitWithAction}
        className="space-y-4"
        aria-label="Sign Up Form"
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={nameInputId}>名前</FormLabel>
              <FormControl>
                <Input
                  id={nameInputId}
                  placeholder="名前を入力"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={passwordInputId}>パスワード</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={passwordInputId}
                    placeholder="パスワードを入力"
                    type={showPassword ? 'text' : 'password'}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-translate-y-1/2 absolute top-1/2 right-2"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={confirmPasswordInputId}>
                パスワード（確認）
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={confirmPasswordInputId}
                    placeholder="パスワードを再入力"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-translate-y-1/2 absolute top-1/2 right-2"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword
                        ? 'パスワードを隠す'
                        : 'パスワードを表示'}
                    </span>
                  </Button>
                </div>
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
            ? 'アカウント作成中...'
            : 'アカウントを作成'}
        </Button>
      </form>
    </Form>
  );
}
