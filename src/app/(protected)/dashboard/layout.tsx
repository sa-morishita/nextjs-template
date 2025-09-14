import {
  DashboardFooter,
  DashboardHeader,
} from '@/components/dashboard/layout';

export default function ProtectedLayout(props: LayoutProps<'/dashboard'>) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1">{props.children}</main>
      <DashboardFooter />
    </div>
  );
}
