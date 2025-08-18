import { Suspense } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </div>
    </div>
  );
}
