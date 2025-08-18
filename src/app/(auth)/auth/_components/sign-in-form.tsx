'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { Eye, EyeOff, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  resendVerificationEmailAction,
  signInAction,
} from '@/lib/actions/auth';
import { AUTH_MESSAGES } from '@/lib/domain/auth';
import { signInSchema } from '@/lib/schemas';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';

export function SignInForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showResendButton, setShowResendButton] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const router = useRouter();
  const emailInputId = useId();
  const passwordInputId = useId();

  const { form, action, handleSubmitWithAction, resetFormAndAction } =
    useHookFormAction(signInAction, zodResolver(signInSchema), {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          email: '',
          password: '',
        },
      },
      actionProps: {
        onSuccess: () => {
          toast.success('サインインしました');
          resetFormAndAction();
          setShowResendButton(false);
          router.push('/dashboard/mypage');
        },
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            AUTH_MESSAGES.SIGNIN_ERROR,
          );
          toast.error(message);
          // メール未認証エラーの場合は再送信ボタンを表示
          if (message.includes(AUTH_MESSAGES.EMAIL_NOT_VERIFIED)) {
            setShowResendButton(true);
          }
        },
      },
    });

  const handleResendVerification = async () => {
    const email = form.getValues('email');
    if (!email) {
      toast.error(AUTH_MESSAGES.EMAIL_REQUIRED);
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmailAction({ email });
      toast.success(AUTH_MESSAGES.EMAIL_VERIFICATION_RESENT);
    } catch (_error) {
      toast.error(AUTH_MESSAGES.EMAIL_VERIFICATION_ERROR);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmitWithAction}
        className="space-y-4"
        aria-label="Sign In Form"
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

        {/* パスワードを忘れた場合のリンク */}
        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-primary text-sm hover:underline"
          >
            パスワードを忘れましたか？
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={action.status === 'executing'}
        >
          {action.status === 'executing' ? 'サインイン中...' : 'サインイン'}
        </Button>

        {/* メール認証エラー時の再送信ボタン */}
        {showResendButton && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start space-x-3">
              <Mail className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 text-sm">
                  メールアドレスの認証が必要です
                </p>
                <p className="mt-1 text-amber-700 text-sm">
                  受信したメールから認証を完了するか、下のボタンで認証メールを再送信してください。
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={isResending}
                  onClick={handleResendVerification}
                >
                  {isResending ? '送信中...' : '認証メールを再送信'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
