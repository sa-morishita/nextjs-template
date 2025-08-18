/**
 * 認証関連のUsecases
 */
import 'server-only';
import { signOut } from '@/lib/services/auth';

/**
 * サインアウトのビジネスロジック
 * - セッション無効化
 */
export async function signOutUsecase(): Promise<void> {
  await signOut();
}
