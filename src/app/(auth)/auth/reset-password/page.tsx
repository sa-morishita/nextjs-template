import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ResetPasswordForm } from '../_components/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>新しいパスワードを設定</CardTitle>
        <CardDescription>
          新しいパスワードを入力してください。パスワードは12文字以上で、大文字・小文字・数字・記号を含めてください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
      <CardFooter>
        <div className="text-muted-foreground text-sm">
          リンクが無効な場合は{' '}
          <Link
            href="/sample/auth/forgot-password"
            className="text-primary hover:underline"
          >
            新しいリセットリンクを要求
          </Link>
          してください
        </div>
      </CardFooter>
    </Card>
  );
}
