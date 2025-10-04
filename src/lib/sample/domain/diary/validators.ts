/**
 * Diary（日記）ドメインのバリデーター
 */
import { DIARY_VALIDATION } from './constants';

/**
 * タイトルの妥当性を検証する
 * @param title 日記のタイトル
 * @returns 妥当な場合はtrue
 */
export function isValidDiaryTitle(title: string): boolean {
  if (title.length < DIARY_VALIDATION.MIN_TITLE_LENGTH) {
    return false;
  }
  if (title.length > DIARY_VALIDATION.MAX_TITLE_LENGTH) {
    return false;
  }
  // 制御文字が含まれていないことを確認
  return !DIARY_VALIDATION.containsControlCharacters(title);
}

/**
 * コンテンツの妥当性を検証する
 * @param content 日記の本文
 * @returns 妥当な場合はtrue
 */
export function isValidDiaryContent(content: string): boolean {
  if (content.length < DIARY_VALIDATION.MIN_CONTENT_LENGTH) {
    return false;
  }
  if (content.length > DIARY_VALIDATION.MAX_CONTENT_LENGTH) {
    return false;
  }
  // 制御文字が含まれていないことを確認
  return !DIARY_VALIDATION.containsControlCharacters(content);
}
