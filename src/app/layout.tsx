import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { notoSansJP } from '@/lib/utils/fonts';

export const metadata: Metadata = {
  title: 'Next.js 15 Template',
  description: 'Next.js 15 Template',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} antialiased`}>
        <NuqsAdapter>
          {children}
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
