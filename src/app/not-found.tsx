import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-6xl font-serif font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-2">页面未找到</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        你访问的页面不存在或已被移除。请检查 URL 是否正确，或返回首页。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Home className="w-4 h-4" />
        返回首页
      </Link>
    </div>
  );
}
