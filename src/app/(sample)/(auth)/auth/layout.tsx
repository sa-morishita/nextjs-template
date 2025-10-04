import { Suspense } from 'react';

export default function AuthLayout(props: LayoutProps<'/auth'>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>{props.children}</Suspense>
      </div>
    </div>
  );
}
