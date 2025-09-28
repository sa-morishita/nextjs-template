import 'server-only';
import { signOut } from '@/lib/services/auth';

export async function signOutUsecase(): Promise<void> {
  await signOut();
}
