'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resetPasswordAction } from '@/lib/actions/auth';
import { AUTH_MESSAGES } from '@/lib/domain/auth';
import { resetPasswordSchema } from '@/lib/schemas';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';
import { cn } from '@/lib/utils/utils';

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  const { form, action, handleSubmitWithAction } = useHookFormAction(
    resetPasswordAction,
    zodResolver(resetPasswordSchema),
    {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          password: '',
          confirmPassword: '',
          token: token,
        },
      },
      actionProps: {
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            AUTH_MESSAGES.PASSWORD_RESET_ERROR,
          );
          toast.error(message);
        },
      },
    },
  );

  // トークンが変更されたらフォームに設定
  useEffect(() => {
    if (token) {
      form.setValue('token', token);
    }
  }, [token, form]);

  // トークンがない場合の表示
  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-destructive">
          <h3 className="font-semibold text-lg">無効なリンクです</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            パスワードリセットリンクが無効または期限切れです。
          </p>
        </div>
        <a
          href="/auth/forgot-password"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          新しいリセットリンクを要求
        </a>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmitWithAction}
        className="space-y-4"
        aria-label="Reset Password Form"
      >
        {/* 隠しフィールド：トークン */}
        <input type="hidden" {...form.register('token')} />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={passwordInputId}>新しいパスワード</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={passwordInputId}
                    placeholder="新しいパスワードを入力（12文字以上、大文字・小文字・数字・記号を含む）"
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
            ? 'パスワード更新中...'
            : 'パスワードを更新'}
        </Button>
      </form>
    </Form>
  );
}
