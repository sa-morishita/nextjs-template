import Link from 'next/link';
import { LineLoginButton } from '@/components/sample/auth/line-login-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { env } from '@/env';
import { SignUpForm } from '../_components/sign-up-form';

export default function SignUpPage() {
  // LINE OAuth設定が存在するかチェック
  const isLineLoginEnabled = !!(
    env.LINE_LOGIN_CHANNEL_ID && env.LINE_LOGIN_CHANNEL_SECRET
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>新規登録</CardTitle>
        <CardDescription>新しいアカウントを作成してください</CardDescription>
      </CardHeader>
      <CardContent>
        {isLineLoginEnabled ? (
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">メールアドレス</TabsTrigger>
              <TabsTrigger value="line">LINE</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="mt-6">
              <SignUpForm />
            </TabsContent>
            <TabsContent value="line" className="mt-6">
              <div className="space-y-4">
                <LineLoginButton />
                <div className="text-center text-muted-foreground text-sm">
                  <p>LINEアカウントで簡単に登録できます</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <SignUpForm />
        )}
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground text-sm">
          既にアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            ログイン
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
