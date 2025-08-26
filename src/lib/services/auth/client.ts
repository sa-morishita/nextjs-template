import {
  genericOAuthClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { env } from '@/app/env.mjs';
import type { auth } from './config';

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [genericOAuthClient(), inferAdditionalFields<typeof auth>()],
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;
