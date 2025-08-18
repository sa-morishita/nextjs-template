// Next.js 15 + Better Auth のベストプラクティス (2025年7月)
// Middleware: 楽観的チェック（UX改善）+ Server Components/Actions: 厳密な検証

import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルはスキップ
  if (
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next();
  }

  // Better Auth公式のgetSessionCookieを使用した楽観的チェック
  const sessionCookie = getSessionCookie(request);

  const isAuthRoute = pathname.startsWith('/auth');
  const isEmailVerificationRoute = pathname.startsWith('/auth/verify-email');
  const isProtectedRoute = pathname.startsWith('/dashboard/mypage');

  // 保護されたルートでセッションクッキーがない場合のリダイレクト
  if (!sessionCookie && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーが認証ページにアクセスした場合のリダイレクト（メール認証ページは除く）
  if (sessionCookie && isAuthRoute && !isEmailVerificationRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard/mypage';
    return NextResponse.redirect(url);
  }

  // ルートパス(/)へのアクセスをサインアップページにリダイレクト
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signup';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
