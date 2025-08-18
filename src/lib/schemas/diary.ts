import { z } from 'zod';

// 日記作成用スキーマ
export const createDiaryFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'タイトルを入力してください')
    .max(100, 'タイトルは100文字以内で入力してください'),
  content: z
    .string()
    .trim()
    .min(1, '本文を入力してください')
    .max(1000, '本文は1000文字以内で入力してください'),
  imageUrl: z
    .string()
    .url('正しいURLを入力してください')
    .optional()
    .or(z.literal('')),
});

// 型のエクスポート
export type CreateDiaryFormInput = z.infer<typeof createDiaryFormSchema>;
