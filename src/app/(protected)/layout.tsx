import {
  DashboardFooter,
  DashboardHeader,
} from '@/components/dashboard/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1">{children}</main>
      <DashboardFooter />
    </div>
  );
}
