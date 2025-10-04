/**
 * TODO（タスク）ドメインのバリデーター
 */
import { TODO_VALIDATION } from './constants';

/**
 * タイトルの妥当性を検証する
 * @param title タスクのタイトル
 * @returns 妥当な場合はtrue
 */
export function isValidTodoTitle(title: string): boolean {
  if (title.length < TODO_VALIDATION.MIN_TITLE_LENGTH) {
    return false;
  }
  if (title.length > TODO_VALIDATION.MAX_TITLE_LENGTH) {
    return false;
  }
  // 制御文字が含まれていないことを確認
  return !TODO_VALIDATION.containsControlCharacters(title);
}
