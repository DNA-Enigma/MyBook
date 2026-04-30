'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-5xl font-serif font-bold text-destructive mb-4">出错了</h1>
      <h2 className="text-xl font-semibold text-foreground mb-2">应用遇到了意外错误</h2>
      <p className="text-muted-foreground mb-2 text-center max-w-md">
        {error.message || '未知错误'}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground mb-8">错误码: {error.digest}</p>
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
