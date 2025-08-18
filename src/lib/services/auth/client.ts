import { createAuthClient } from 'better-auth/react';
import { env } from '@/app/env.mjs';

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SITE_URL,
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;
