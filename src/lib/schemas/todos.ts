import { z } from 'zod';

// TODOフォーム用スキーマ（実際に使用されているもののみ）
export const createTodoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'タイトルを入力してください')
    .max(255, 'タイトルは255文字以内で入力してください'),
});

export const updateTodoFormSchema = z.object({
  id: z.string().min(1),
  title: z
    .string()
    .trim()
    .min(1, 'タイトルを入力してください')
    .max(255, 'タイトルは255文字以内で入力してください')
    .optional(),
  completed: z.boolean().optional(),
});

// フィルタリング用のスキーマ
export const todoFilterSchema = z.object({
  completed: z.boolean().optional(),
  search: z.string().optional(),
});

// 型のエクスポート（実際に使用されているもののみ）
export type TodoFilter = z.infer<typeof todoFilterSchema>;
