import Link from 'next/link';
import { env } from '@/app/env.mjs';
import { LineLoginButton } from '@/components/auth/line-login-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AUTH_ERROR_MESSAGES } from '@/lib/constants/auth-errors';
import { SignInForm } from '../_components/sign-in-form';

export default async function LoginPage(props: PageProps<'/auth/login'>) {
  const params = await props.searchParams;
  const errorMessage = params.error
    ? AUTH_ERROR_MESSAGES[params.error as keyof typeof AUTH_ERROR_MESSAGES]
    : null;
  const successMessage =
    params.message === 'password-reset-success'
      ? 'パスワードがリセットされました。新しいパスワードでログインしてください。'
      : null;

  // LINE OAuth設定が存在するかチェック
  const isLineLoginEnabled = !!(
    env.LINE_LOGIN_CHANNEL_ID && env.LINE_LOGIN_CHANNEL_SECRET
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <CardDescription>アカウントにログインしてください</CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-600 text-sm">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-green-600 text-sm">
            {successMessage}
          </div>
        )}
        {isLineLoginEnabled ? (
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">メールアドレス</TabsTrigger>
              <TabsTrigger value="line">LINE</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="mt-6">
              <SignInForm />
            </TabsContent>
            <TabsContent value="line" className="mt-6">
              <div className="space-y-4">
                <LineLoginButton />
                <div className="text-center text-muted-foreground text-sm">
                  <p>初めてご利用の方も上記ボタンからログインできます</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <SignInForm />
        )}
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground text-sm">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/signup" className="text-primary hover:underline">
            新規登録
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
