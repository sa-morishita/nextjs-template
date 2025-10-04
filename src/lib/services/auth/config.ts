import * as Sentry from '@sentry/nextjs';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { genericOAuth } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { db } from '@/db';
import { user } from '@/db/schema';
import { env } from '@/env';
import {
  sendPasswordResetEmailWithReact,
  sendVerificationEmailWithReact,
} from '@/lib/services/email';
import { uploadProfileImageFromUrl } from '@/lib/services/profile-image.service';
import { logger } from '@/lib/utils/logger';

// LINE OAuthプロファイルの型定義
interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL,
    // SSL設定: 本番環境（httpsで始まる）のみSSLを有効化
    ssl: env.NEXT_PUBLIC_SITE_URL.startsWith('https')
      ? { rejectUnauthorized: false } // 本番環境ではSSL必須（証明書検証は緩和）
      : false, // ローカル開発環境（http://localhost）はSSL無効
    connectionTimeoutMillis: 10000, // 10秒タイムアウト
    idleTimeoutMillis: 30000, // 30秒アイドルタイムアウト
    max: 10, // 最大接続数
  }),
  secret: env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [env.NEXT_PUBLIC_SITE_URL],
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['line'], // LINE自動リンク許可
    },
  },
  user: {
    additionalFields: {
      lineUserId: {
        type: 'string',
        required: false,
        input: false, // システムが自動設定
      },
      lineUserName: {
        type: 'string',
        required: false,
        input: false, // システムが自動設定
      },
      lastLoginAt: {
        type: 'date',
        required: false,
        input: false, // システムが自動設定
      },
    },
  },
  // データベースフック設定
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // セッション作成時（ログイン時）にlastLoginAtを更新
          try {
            await db
              .update(user)
              .set({ lastLoginAt: new Date() })
              .where(eq(user.id, session.userId));
            logger.info('✅ lastLoginAt更新完了:', session.userId);
          } catch (error) {
            logger.error('❌ lastLoginAt更新エラー:', error);
            // エラーが発生してもログイン処理は続行
            Sentry.captureException(error, {
              tags: {
                service: 'auth',
                hook: 'session.create.after',
              },
              extra: {
                userId: session.userId,
              },
            });
          }
        },
      },
    },
    user: {
      create: {
        after: async (createdUser) => {
          logger.info('🔥 ユーザー作成フック実行:', {
            userId: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
          });

          try {
            // 画像URLが存在する場合、永続化処理を実行
            if (createdUser.image?.includes('profile.line-scdn.net')) {
              logger.info(
                '🖼️ LINEプロフィール画像を永続化します:',
                createdUser.image,
              );
              const uploadResult = await uploadProfileImageFromUrl(
                createdUser.image,
                createdUser.id,
              );

              if (uploadResult.url) {
                logger.info('✅ 画像の永続化に成功しました:', uploadResult.url);

                // userテーブルのimageカラムも更新
                await db
                  .update(user)
                  .set({ image: uploadResult.url })
                  .where(eq(user.id, createdUser.id));
              } else {
                logger.warn(
                  '⚠️ 画像の永続化に失敗しました:',
                  uploadResult.error,
                );

                // Sentryに警告として記録（エラーではないがモニタリング対象）
                Sentry.captureMessage('LINE画像の永続化に失敗しました', {
                  level: 'warning',
                  tags: {
                    service: 'line-auth',
                    userId: createdUser.id,
                  },
                  extra: {
                    error: uploadResult.error,
                    originalImageUrl: createdUser.image,
                    userName: createdUser.name,
                  },
                });

                // 失敗してもLINEの一時URLを使用してユーザー作成は続行
              }
            }
          } catch (error) {
            logger.error(
              '❌ プロフィール画像処理中にエラーが発生しました:',
              error,
            );

            // Sentryにエラーを送信
            Sentry.captureException(error, {
              tags: {
                service: 'auth',
                hook: 'user.create.after',
              },
              extra: {
                userId: createdUser.id,
                userName: createdUser.name,
                originalImageUrl: createdUser.image,
              },
            });
          }
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // メール認証を必須に
    sendResetPassword: async ({ user, url }) => {
      logger.info('🔑 Password reset requested for:', user.email);
      logger.info('🔑 Password reset URL:', url);

      try {
        await sendPasswordResetEmailWithReact({
          to: user.email,
          userName: user.name || undefined,
          resetUrl: url,
          companyName: 'TODO App',
        });

        logger.info('🔑 Password reset email sent successfully');
      } catch (error) {
        logger.error('🔑 Failed to send password reset email:', error);
        throw new Error('パスワードリセットメールの送信に失敗しました');
      }
    },
    // パスワードリセット後のコールバック
    onPasswordReset: async ({ user }) => {
      logger.info('🔑 Password successfully reset for user:', user.email);
      // 必要に応じて追加のログ記録やセッション無効化を実装
    },
    // トークンの有効期限（1時間 = 3600秒）-
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  emailVerification: {
    // メール認証を自動送信（サインアップ時）
    sendOnSignUp: true,
    // メール認証必須（ログイン時）
    autoSignInAfterVerification: true,
    // 認証トークンの有効期限（秒）
    verificationTokenExpiresIn: 60 * 60 * 24, // 24時間
    // React Email テンプレートを使用したカスタムメール送信関数
    sendVerificationEmail: async ({ user, url }, _request) => {
      logger.info('📧 Sending React Email verification to:', user.email);
      logger.info('📧 Verification URL:', url);

      try {
        await sendVerificationEmailWithReact({
          to: user.email,
          userName: user.name || undefined,
          verificationUrl: url,
          companyName: 'TODO App',
        });

        logger.info('📧 React Email verification sent successfully');
      } catch (error) {
        logger.error('📧 Failed to send React Email verification:', error);
        throw new Error('認証メールの送信に失敗しました');
      }
    },
  },
  // クッキー設定（サイトURLのプロトコルに応じて自動設定）
  advanced: {
    cookies: {
      session_token: {
        attributes: {
          secure: env.NEXT_PUBLIC_SITE_URL.startsWith('https://'), // HTTPS環境では必須
          sameSite: 'lax',
          httpOnly: true,
          path: '/',
          // ローカル開発時の無限リダイレクト回避のため明示的にドメインを設定しない
          // domain: undefined, // ブラウザが自動的にドメインを設定
        },
        // デバッグ用のクッキー削除機能を改善
        clearOn: ['signOut'],
      },
    },
  },
  // プラグイン設定
  plugins: [
    // LINE OAuth設定（LINE設定が存在する場合のみ有効化）
    ...(env.LINE_LOGIN_CHANNEL_ID && env.LINE_LOGIN_CHANNEL_SECRET
      ? [
          genericOAuth({
            config: [
              {
                providerId: 'line',
                clientId: env.LINE_LOGIN_CHANNEL_ID,
                clientSecret: env.LINE_LOGIN_CHANNEL_SECRET,
                authorizationUrl:
                  'https://access.line.me/oauth2/v2.1/authorize',
                tokenUrl: 'https://api.line.me/oauth2/v2.1/token',
                userInfoUrl: 'https://api.line.me/v2/profile',
                scopes: ['profile', 'openid'],
                responseType: 'code',
                pkce: true, // PKCE有効
                mapProfileToUser: async (profile: Record<string, unknown>) => {
                  logger.info('📱 LINE profile:', profile);
                  // プロファイルを型安全にキャスト
                  const lineProfile = profile as unknown as LineProfile;
                  return {
                    id: lineProfile.userId,
                    name: lineProfile.displayName,
                    image: lineProfile.pictureUrl,
                    email: `no-email-${lineProfile.userId}@line.local`, // Better Authはemailを必須としているため仮のアドレス
                    lineUserId: lineProfile.userId,
                    lineUserName: lineProfile.displayName || 'LINEユーザー',
                  };
                },
              },
            ],
          }),
        ]
      : []),
    // Server Actionsでセッションクッキーを設定するためのnextCookiesプラグイン
    nextCookies(),
  ],
});

// Better Auth の型推論
export type Session = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user;
};
export type User = typeof auth.$Infer.Session.user;
