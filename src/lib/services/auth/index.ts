// configからのエクスポート

// clientからのエクスポート (クライアント側のみ)
export {
  authClient,
  getSession as getSessionClient,
  signIn,
  signOut as signOutClient,
  signUp,
  useSession,
} from './client';
export type { Session, User } from './config';
export { auth } from './config';

// serviceからのエクスポート (サーバー側のみ)
export {
  getSession,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  type SignInData,
  type SignUpData,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from './service';
