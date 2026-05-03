import { BookOpen, Palette, Database, User, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { notes, profiles } from "@/storage/database/shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";

async function getRecentNotes() {
  try {
    const result = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        category: notes.category,
        tags: notes.tags,
        created_at: sql<string>`to_char(${notes.created_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
        author_name: profiles.name,
        author_avatar: profiles.avatar_url,
      })
      .from(notes)
      .leftJoin(profiles, eq(notes.author_id, profiles.id))
      .where(eq(notes.is_public, true))
      .orderBy(desc(notes.created_at))
      .limit(6);
    return result;
  } catch {
    return [];
  }
}

async function getNoteCount() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(eq(notes.is_public, true));
    return Number(result[0]?.count) || 0;
  } catch {
    return 0;
  }
}

function truncate(str: string | null | undefined, n: number) {
  if (!str) return "";
  return str.length > n ? str.substring(0, n - 1) + "..." : str;
}

export default async function HomePage() {
  const recentNotes = await getRecentNotes();
  const noteCount = await getNoteCount();

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-background py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
            探索、记录、分享
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            一个集笔记管理、作品展示、资源分享于一体的个人综合服务门户
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/notes"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              浏览笔记 <ArrowRight size={16} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card text-foreground border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
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
                title: "博客",
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
                title: "了解站长",
                desc: "了解站长的技能、经历与联系方式",
                href: "/about-admin",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group block bg-card rounded-xl p-6 shadow-card hover:shadow-float transition-all duration-300 border border-border/0 hover:border-border/10"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
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
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                最新笔记
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                已有 {noteCount} 篇公开笔记
              </p>
            </div>
            <Link
              href="/notes"
              className="text-sm font-medium text-primary hover:underline"
            >
              查看全部
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">暂无笔记</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="group block bg-card rounded-xl p-6 shadow-card hover:shadow-float transition-all duration-300 border border-border/0 hover:border-border/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {note.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {truncate(note.content, 120)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-[10px]">
                      {note.author_name?.[0] || "?"}
                    </span>
                    <span>{note.author_name || "匿名"}</span>
                    <span>·</span>
                    <span>
                      {note.created_at
                        ? new Date(note.created_at).toLocaleDateString("zh-CN")
                        : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
