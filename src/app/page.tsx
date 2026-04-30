"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Image, FolderOpen, User, ArrowRight, Lock } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  is_public: boolean;
  profiles?: { name: string };
}

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes?public=true&limit=3")
      .then((r) => r.json())
      .then((d) => setNotes(d.notes?.slice(0, 3) || []))
      .finally(() => setLoading(false));
  }, []);

  const modules = [
    {
      href: "/notes",
      icon: FileText,
      title: "笔记",
      desc: "记录技术思考与生活随笔，支持 Markdown 编辑与分类管理",
    },
    {
      href: "/works",
      icon: Image,
      title: "作品",
      desc: "展示设计项目、开发作品与摄影作品，按分类浏览",
    },
    {
      href: "/resources",
      icon: FolderOpen,
      title: "资源库",
      desc: "汇集软件工具、文档资料、设计素材与 Docker 镜像",
    },
    {
      href: "/profile",
      icon: User,
      title: "关于我",
      desc: "了解我的技术栈、工作经历与联系方式",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border bg-card px-6 pb-16 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-serif text-5xl font-bold leading-tight text-primary md:text-7xl">
            探索、记录、分享
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            一个属于创作者的个人综合服务门户，汇聚笔记、作品与资源，让知识沉淀更有价值。
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <Link href="/notes">
                浏览笔记
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/works">查看作品</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-10 text-center font-serif text-3xl font-bold text-primary">
          核心模块
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group rounded-xl bg-card p-6 shadow-card transition-all hover:shadow-float"
            >
              <m.icon className="mb-4 h-8 w-8 text-primary" strokeWidth={1.5} />
              <h3 className="mb-2 text-lg font-semibold text-primary">{m.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary">
                进入
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Notes */}
      <section className="border-t border-border bg-card px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold text-primary">最新动态</h2>
              <p className="mt-2 text-muted-foreground">最近发布的笔记文章</p>
            </div>
            <Link
              href="/notes"
              className="flex items-center text-sm font-medium text-primary hover:underline"
            >
              查看全部
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="group rounded-xl bg-background p-6 shadow-card transition-all hover:shadow-float"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {note.category}
                    </span>
                    {!note.is_public && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-primary group-hover:underline">
                    {note.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {note.content?.replace(/[#*`]/g, "").slice(0, 120)}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {note.profiles?.name || "匿名"} · {new Date(note.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          个人门户 · 探索、记录、分享
        </div>
      </footer>
    </div>
  );
}
