/**
 * TODO（タスク）ドメインの定数定義
 */

// TODO関連のバリデーションルール
export const TODO_VALIDATION = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  // 制御文字を検証する関数（正規表現の代わりに使用）
  containsControlCharacters: (text: string): boolean => {
    // 各文字をチェックして制御文字があるか確認
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // 0x00-0x1F (0-31) と 0x7F (127) は制御文字
      if (charCode <= 0x1f || charCode === 0x7f) {
        return true;
      }
    }
    return false;
  },
} as const;

// TODO関連のメッセージ
export const TODO_MESSAGES = {
  TITLE_TOO_SHORT: 'タイトルは1文字以上入力してください',
  TITLE_TOO_LONG: 'タイトルは100文字以内で入力してください',
  TITLE_INVALID_CHARS: 'タイトルに使用できない文字が含まれています',
  DUPLICATE_TITLE: '同じタイトルの未完了タスクが既に存在します',
  CREATION_SUCCESS: 'タスクを追加しました',
  CREATION_ERROR: 'タスクの追加に失敗しました',
  UPDATE_SUCCESS: 'タスクを更新しました',
  UPDATE_ERROR: 'タスクの更新に失敗しました',
  DELETE_SUCCESS: 'タスクを削除しました',
  DELETE_ERROR: 'タスクの削除に失敗しました',
  TOGGLE_SUCCESS: 'タスクのステータスを更新しました',
  TOGGLE_ERROR: 'タスクのステータス更新に失敗しました',
} as const;

// TODOのステータス
export const TODO_STATUS = {
  INCOMPLETE: false,
  COMPLETED: true,
} as const;

export type TodoStatus = (typeof TODO_STATUS)[keyof typeof TODO_STATUS];
