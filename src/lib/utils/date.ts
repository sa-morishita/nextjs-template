/**
 * 日付フォーマットユーティリティ
 * date-fnsの代わりにIntl.DateTimeFormatを使用
 */

const JAPAN_TIMEZONE = 'Asia/Tokyo';

/**
 * 日付を日本語形式でフォーマット（年月日）
 * @example formatDate(new Date()) // "2025年8月26日"
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * 日時を日本語形式でフォーマット（年月日 時分）
 * @example formatDateTime(new Date()) // "2025年8月26日 14:30"
 */
export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

/**
 * 日時をスラッシュ区切りでフォーマット（yyyy/MM/dd HH:mm形式）
 * @example formatDateTimeSlash(new Date()) // "2025/08/26 14:30"
 */
export function formatDateTimeSlash(date: Date | string | number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 指定された日時の日本時間での日の開始時刻を取得（00:00:00）
 * @param date 基準となる日時（デフォルトは現在時刻）
 * @returns 日本時間での日の開始時刻（UTC）
 */
export function getJapanStartOfDay(date: Date = new Date()): Date {
  // 日本時間の年月日を取得
  const japanDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAPAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // 日本時間の00:00:00として新しいDateオブジェクトを作成
  return new Date(`${japanDateStr}T00:00:00+09:00`);
}

/**
 * 指定された日時の日本時間での日の終了時刻を取得（23:59:59.999）
 * @param date 基準となる日時（デフォルトは現在時刻）
 * @returns 日本時間での日の終了時刻（UTC）
 */
export function getJapanEndOfDay(date: Date = new Date()): Date {
  // 日本時間の年月日を取得
  const japanDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAPAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // 日本時間の23:59:59.999として新しいDateオブジェクトを作成
  return new Date(`${japanDateStr}T23:59:59.999+09:00`);
}
