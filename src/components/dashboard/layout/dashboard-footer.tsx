/**
 * Dashboard Footer Component
 *
 * ベストプラクティス: 静的なフッターコンポーネント
 * 静的にレンダリングされ、キャッシュされる。
 */
export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-muted-foreground text-sm">
          © 2025 TODO App
        </p>
      </div>
    </footer>
  );
}
