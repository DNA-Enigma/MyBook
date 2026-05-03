"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Clock,
  User,
  MessageSquare,
  Plus,
} from "lucide-react";

interface Blog {
  id: string;
  title: string;
  summary: string;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  author_id: string;
  view_count: number;
  like_count: number;
  created_at: string;
  author: { name: string | null; avatar_url: string | null } | null;
}

const categories = ["全部", "技术分享", "问题讨论", "经验总结", "随笔"];

export default function BlogsPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, [activeCategory]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const cat = activeCategory === "全部" ? "all" : activeCategory;
      const res = await fetch(`/api/blogs?category=${cat}`);
      const data = await res.json();
      if (data.blogs) setBlogs(data.blogs);
    } catch (err) {
      console.error("Fetch blogs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter((b) =>
    search
      ? b.title.toLowerCase().includes(search.toLowerCase()) ||
        (b.summary || "").toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            博客
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            技术分享、问题讨论、经验总结 —— 与社区一起成长
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索博客..."
              className="pl-9 bg-muted border-none rounded-md"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {user && (
            <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <Link href="/blog-detail?mode=create">
                <Plus className="mr-1.5 h-4 w-4" />
                写博客
              </Link>
            </Button>
          )}
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="rounded-xl bg-card py-20 text-center shadow-card">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">暂无博客</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog-detail?blog_id=${blog.id}`}
                className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:shadow-float"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {blog.cover_image_url ? (
                    <img
                      src={blog.cover_image_url}
                      alt={blog.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {blog.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(blog.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-primary">
                    {blog.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {blog.summary || "暂无摘要"}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    {blog.author?.avatar_url ? (
                      <img
                        src={blog.author.avatar_url}
                        alt={blog.author.name || ""}
                        className="h-6 w-6 object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {blog.author?.name || "匿名用户"}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {blog.view_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
