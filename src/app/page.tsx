import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BookOpen, Palette, Database, User } from "lucide-react";
import { db } from "@/lib/db";
import { notes, profiles } from "@/storage/database/shared/schema";
import { desc, eq, sql } from "drizzle-orm";

async function getRecentNotes() {
  return db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      category: notes.category,
      tags: notes.tags,
      created_at: notes.created_at,
      author_name: profiles.name,
      author_avatar: profiles.avatar_url,
    })
    .from(notes)
    .leftJoin(profiles, eq(notes.author_id, profiles.id))
    .where(eq(notes.is_public, true))
    .orderBy(desc(notes.created_at))
    .limit(6);
}

async function getNoteCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notes)
    .where(eq(notes.is_public, true));
  return result[0]?.count ?? 0;
}

function truncate(str: string | null | undefined, n: number) {
  if (!str) return "";
  return str.length > n ? str.substring(0, n - 1) + "..." : str;
}

function formatDate(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NoteCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl p-6 shadow-card animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-surface-container" />
        <div className="h-4 w-24 bg-surface-container rounded" />
      </div>
      <div className="h-6 w-3/4 bg-surface-container rounded mb-2" />
      <div className="h-4 w-full bg-surface-container rounded mb-1" />
      <div className="h-4 w-2/3 bg-surface-container rounded" />
    </div>
  );
}

async function RecentNotesSection() {
  const recentNotes = await getRecentNotes();
  const noteCount = await getNoteCount();

  return (
    <section className="bg-surface rounded-xl p-8 shadow-card">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-serif font-bold text-on-surface mb-2">
            最新笔记
          </h2>
          <p className="text-sm text-on-surface-variant">
            共 {noteCount} 篇公开笔记
          </p>
        </div>
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface hover:opacity-70 transition-opacity"
        >
          查看全部 <ArrowRight size={16} />
        </Link>
      </div>

      {recentNotes.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>暂无公开笔记，登录后创建第一篇吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentNotes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="block bg-surface-container-low rounded-lg p-5 hover:bg-surface-container transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-on-primary">
                    {note.author_name?.[0] || "?"}
                  </span>
                </div>
                <span className="text-sm text-on-surface-variant">
                  {note.author_name || "匿名"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {note.title}
              </h3>
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                {truncate(note.content, 120)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant/60">
                  {formatDate(note.created_at)}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-on-primary">
                  {note.category}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-background py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-on-surface mb-6 tracking-tight leading-[1.1]">
            探索、记录、分享
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            一个集笔记管理、作品展示、资源分享于一体的个人综合服务门户
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/notes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              浏览笔记 <ArrowRight size={16} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-on-surface border border-outline rounded-lg text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              创建账号
            </Link>
          </div>
        </div>
      </section>

      {/* Module Cards */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: "笔记管理",
                desc: "记录技术心得与生活随笔，支持 Markdown 与公开分享",
                href: "/notes",
              },
              {
                icon: Palette,
                title: "作品展示",
                desc: "展示设计与开发项目，构建个人作品集",
                href: "/works",
              },
              {
                icon: Database,
                title: "资源库",
                desc: "分享软件工具、文档资料与 Docker 镜像",
                href: "/resources",
              },
              {
                icon: User,
                title: "关于我",
                desc: "了解我的技能、经历与联系方式",
                href: "/profile",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group block bg-surface rounded-xl p-6 shadow-card hover:shadow-float transition-all duration-300 border border-outline/0 hover:border-outline/10"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-on-primary" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">
                  进入
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Notes */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Suspense fallback={
            <div className="bg-surface rounded-xl p-8 shadow-card">
              <div className="h-8 w-48 bg-surface-container rounded mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-surface-container rounded mb-8 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <NoteCardSkeleton key={i} />
                ))}
              </div>
            </div>
          }>
            <RecentNotesSection />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
