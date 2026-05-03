import { Suspense } from "react";
import BlogDetailClient from "./blog-detail-client";

export default function BlogDetailPage() {
  return (
    <Suspense fallback={<BlogDetailSkeleton />}>
      <BlogDetailClient />
    </Suspense>
  );
}

function BlogDetailSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-4 w-1/4 animate-pulse rounded bg-muted" />
      <div className="mt-8 aspect-video animate-pulse rounded-xl bg-muted" />
      <div className="mt-8 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </main>
  );
}
