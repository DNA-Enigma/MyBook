import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { notes, works, resources, profiles } from "@/storage/database/shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";

// 强制动态渲染，避免构建时数据库不可用导致统计数据为0
export const dynamic = "force-dynamic";
import {
  FileText,
  ImageIcon,
  FolderOpen,
  ArrowRight,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

async function getOwnerProfile() {
  try {
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.role, "admin"))
      .limit(1);
    return profile[0] || null;
  } catch {
    return null;
  }
}

async function getRecentNotes() {
  try {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.is_public, true))
      .orderBy(desc(notes.created_at))
      .limit(6);
  } catch {
    return [];
  }
}

async function getRecentWorks() {
  try {
    return await db
      .select()
      .from(works)
      .orderBy(desc(works.created_at))
      .limit(6);
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [noteCount, workCount, resourceCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(notes).where(eq(notes.is_public, true)),
      db.select({ count: sql<number>`count(*)` }).from(works),
      db.select({ count: sql<number>`count(*)` }).from(resources).where(eq(resources.is_public, true)),
    ]);
    return {
      notes: noteCount[0]?.count || 0,
      works: workCount[0]?.count || 0,
      resources: resourceCount[0]?.count || 0,
    };
  } catch {
    return { notes: 0, works: 0, resources: 0 };
  }
}

export default async function HomePage() {
  const [profile, recentNotes, recentWorks, stats] = await Promise.all([
    getOwnerProfile(),
    getRecentNotes(),
    getRecentWorks(),
    getStats(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/60 via-background to-muted/30" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">欢迎来访</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              个人综合服务门户
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              在这里记录技术笔记、展示作品成果、分享实用资源，与你一起成长。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/notes">
                  浏览笔记
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="gap-2">
                <Link href="/about">
                  <User className="h-4 w-4" />
                  关于站长
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-14 grid grid-cols-3 gap-4 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm md:mt-16 md:flex md:gap-8 md:p-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground md:text-3xl">{stats.notes}</div>
              <div className="mt-1 text-sm text-muted-foreground">篇笔记</div>
            </div>
            <div className="text-center md:border-l md:border-r md:border-border md:px-8">
              <div className="text-2xl font-bold text-foreground md:text-3xl">{stats.works}</div>
              <div className="mt-1 text-sm text-muted-foreground">个作品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground md:text-3xl">{stats.resources}</div>
              <div className="mt-1 text-sm text-muted-foreground">个资源</div>
            </div>
          </div>
        </div>
      </section>

      {/* Module Cards */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Notes */}
          <Link
            href="/notes"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">笔记博客</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              记录学习心得、技术总结与日常思考
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-primary">
              去浏览
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Works */}
          <Link
            href="/works"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">作品展示</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              展示项目成果、设计与开发作品
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-primary">
              去浏览
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Resources */}
          <Link
            href="/resources"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">资源库</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              软件、文档、Docker镜像等资源分享
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-primary">
              去浏览
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <section className="border-t border-border bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">最新笔记</h2>
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/notes">
                  查看全部
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {note.category || "未分类"}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {note.title}
                  </h3>
                  <div className="mt-auto flex items-center gap-1 pt-4 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(note.created_at).toLocaleDateString("zh-CN")}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Works */}
      {recentWorks.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">最新作品</h2>
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/works">
                  查看全部
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentWorks.map((work) => (
                <Link
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md"
                >
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <Image
                      src={work.cover_image_url || "/placeholder-work.png"}
                      alt={work.title}
                      width={400}
                      height={225}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                      {work.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {work.description || "暂无描述"}
                    </p>
                    {typeof work.tech_stack === "string" && work.tech_stack && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {work.tech_stack.split(",").slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
