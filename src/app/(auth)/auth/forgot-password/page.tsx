import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ForgotPasswordForm } from '../_components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>パスワードを忘れた場合</CardTitle>
        <CardDescription>
          メールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground text-sm">
          パスワードを思い出しましたか？{' '}
          <Link
            href="/sample/auth/login"
            className="text-primary hover:underline"
          >
            ログイン
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
