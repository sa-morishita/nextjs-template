/**
 * 日付フォーマットユーティリティ
 * date-fnsの代わりにIntl.DateTimeFormatを使用
 */

const JAPAN_TIMEZONE = 'Asia/Tokyo';
const ISO_DATE_QUERY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 日付を日本語形式でフォーマット（年月日）
 * @example formatDate(new Date()) // "2025年8月26日"
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: JAPAN_TIMEZONE,
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
    timeZone: JAPAN_TIMEZONE,
  }).format(new Date(date));
}

/**
 * 指定された日時の日本時間での日の開始時刻を取得（00:00:00）
 * @param date 基準となる日時（デフォルトは現在時刻）
 * @returns 日本時間での日の開始時刻（UTC）
 */
export function getJapanStartOfDay(date: Date = new Date()): Date {
  const japanDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAPAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return new Date(`${japanDateStr}T00:00:00+09:00`);
}

/**
 * 指定された日時の日本時間での日の終了時刻を取得（23:59:59.999）
 * @param date 基準となる日時（デフォルトは現在時刻）
 * @returns 日本時間での日の終了時刻（UTC）
 */
export function getJapanEndOfDay(date: Date = new Date()): Date {
  const japanDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAPAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return new Date(`${japanDateStr}T23:59:59.999+09:00`);
}

/**
 * 検索パラメータとして渡される ISO 日付文字列 (YYYY-MM-DD) を検証して Date に変換
 */
export function parseDateFromQueryParam(
  value: string | string[] | undefined | null,
): Date | null {
  if (value === undefined || value === null) {
    return null;
  }

  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !ISO_DATE_QUERY_PATTERN.test(candidate)) {
    return null;
  }

  const parsed = new Date(`${candidate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
