/**
 * Date formatting utility for Japanese timezone
 */

import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const JAPAN_TIMEZONE = 'Asia/Tokyo';

/**
 * 指定された日時の日本時間での日の開始時刻を取得（00:00:00）
 * @param date 基準となる日時（デフォルトは現在時刻）
 * @returns 日本時間での日の開始時刻（UTC）
 */
export function getJapanStartOfDay(date: Date = new Date()): Date {
  // 日本時間に変換
  const japanDate = toZonedTime(date, JAPAN_TIMEZONE);

  // 日本時間での00:00:00に設定
  japanDate.setHours(0, 0, 0, 0);

  // UTCに戻す
  return fromZonedTime(japanDate, JAPAN_TIMEZONE);
}

/**
 * 指定された日時の日本時間での日の終了時刻を取得（23:59:59.999）
 * @param date 基準となる日時（デフォルトは現在時刻）
 * @returns 日本時間での日の終了時刻（UTC）
 */
export function getJapanEndOfDay(date: Date = new Date()): Date {
  // 日本時間に変換
  const japanDate = toZonedTime(date, JAPAN_TIMEZONE);

  // 日本時間での23:59:59.999に設定
  japanDate.setHours(23, 59, 59, 999);

  // UTCに戻す
  return fromZonedTime(japanDate, JAPAN_TIMEZONE);
}
