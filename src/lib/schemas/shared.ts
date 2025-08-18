import { z } from 'zod';

// 共通バリデーション定義
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,128}$/;

export const passwordValidation = z
  .string()
  .regex(
    passwordRegex,
    'パスワードは12文字以上128文字以下で、大文字、小文字、数字、記号をそれぞれ1文字以上含めてください',
  );

export const emailValidation = z
  .string()
  .min(1, 'メールアドレスを入力してください')
  .email('有効なメールアドレスを入力してください');

export const nameValidation = z
  .string()
  .trim()
  .min(1, '名前を入力してください')
  .max(50, '名前は50文字以内で入力してください');
