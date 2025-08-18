/**
 * Diary（日記）ドメインの定数定義
 */

// 日記関連のバリデーションルール
export const DIARY_VALIDATION = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  MIN_CONTENT_LENGTH: 1,
  MAX_CONTENT_LENGTH: 1000,
  // 制御文字を検証する関数（正規表現の代わりに使用）
  containsControlCharacters: (text: string): boolean => {
    // 各文字をチェックして制御文字があるか確認
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // 0x00-0x1F (0-31) と 0x7F (127) は制御文字（改行・タブは除く）
      if (
        (charCode <= 0x1f && charCode !== 0x0a && charCode !== 0x09) ||
        charCode === 0x7f
      ) {
        return true;
      }
    }
    return false;
  },
} as const;

// 日記関連のメッセージ
export const DIARY_MESSAGES = {
  TITLE_TOO_SHORT: 'タイトルは1文字以上入力してください',
  TITLE_TOO_LONG: 'タイトルは100文字以内で入力してください',
  TITLE_INVALID_CHARS: 'タイトルに使用できない文字が含まれています',
  CONTENT_TOO_SHORT: '本文は1文字以上入力してください',
  CONTENT_TOO_LONG: '本文は1000文字以内で入力してください',
  CONTENT_INVALID_CHARS: '本文に使用できない文字が含まれています',
  ALREADY_EXISTS_TODAY: '本日の日記は既に作成されています',
  CREATION_SUCCESS: '日記を作成しました',
  CREATION_ERROR: '日記の作成に失敗しました',
  UPDATE_SUCCESS: '日記を更新しました',
  UPDATE_ERROR: '日記の更新に失敗しました',
  DELETE_SUCCESS: '日記を削除しました',
  DELETE_ERROR: '日記の削除に失敗しました',
} as const;

// 日記のステータス
export const DIARY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type DiaryStatus = (typeof DIARY_STATUS)[keyof typeof DIARY_STATUS];

// 日記のタイプ
export const DIARY_TYPE = {
  DIARY: 'diary',
  NOTE: 'note',
  MEMO: 'memo',
} as const;

export type DiaryType = (typeof DIARY_TYPE)[keyof typeof DIARY_TYPE];
