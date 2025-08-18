import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { account, session, user, verification } from '@/db/schema';
import { emailValidation, nameValidation, passwordValidation } from './shared';

// Better Auth関連のZodスキーマ
export const insertUserSchema = createInsertSchema(user, {
  email: (schema) => schema.email('有効なメールアドレスを入力してください'),
  name: (schema) =>
    schema
      .min(1, '名前を入力してください')
      .max(50, '名前は50文字以内で入力してください'),
});
export const selectUserSchema = createSelectSchema(user);

export const insertSessionSchema = createInsertSchema(session);
export const selectSessionSchema = createSelectSchema(session);

export const insertAccountSchema = createInsertSchema(account);
export const selectAccountSchema = createSelectSchema(account);

export const insertVerificationSchema = createInsertSchema(verification);
export const selectVerificationSchema = createSelectSchema(verification);

// 認証フォーム用スキーマ
export const signInSchema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const signUpSchema = z
  .object({
    email: emailValidation,
    name: nameValidation,
    password: passwordValidation,
    confirmPassword: passwordValidation,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailValidation,
});

export const resetPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: passwordValidation,
    token: z.string().min(1, 'トークンが必要です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export const resendVerificationEmailSchema = z.object({
  email: emailValidation,
});

// 型のエクスポート（認証用）
export type SignInForm = z.infer<typeof signInSchema>;
export type SignUpForm = z.infer<typeof signUpSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type ResendVerificationEmailForm = z.infer<
  typeof resendVerificationEmailSchema
>;
