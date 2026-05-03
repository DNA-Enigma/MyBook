import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { notes, works, resources, profiles } from "@/storage/database/shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import {
  BookOpen,
  Palette,
  Database,
  ArrowRight,
  Github,
  Globe,
  Linkedin,
  Mail,
  FileText,
  Package,
  Box,
  Download,
  Sparkles,
  Code2,
} from "lucide-react";

async function getOwnerProfile() {
  try {
    const result = await db
      .select()
      .from(profiles)
      .orderBy(sql`CASE WHEN ${profiles.role} = 'admin' THEN 0 ELSE 1 END`)
      .limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

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
      })
      .from(notes)
      .where(eq(notes.is_public, true))
      .orderBy(desc(notes.created_at))
      .limit(5);
    return result;
  } catch {
    return [];
  }
}

async function getRecentWorks() {
  try {
    const result = await db
      .select({
        id: works.id,
        title: works.title,
        description: works.description,
        category: works.category,
        cover_image_url: works.cover_image_url,
        tech_stack: works.tech_stack,
        created_at: sql<string>`to_char(${works.created_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      })
      .from(works)
      .where(eq(works.is_public, true))
      .orderBy(desc(works.created_at))
      .limit(5);
    return result;
  } catch {
    return [];
  }
}

async function getRecentResources() {
  try {
    const result = await db
      .select({
        id: resources.id,
        name: resources.name,
        description: resources.description,
        category: resources.category,
        file_size: resources.file_size,
        download_count: resources.download_count,
        created_at: sql<string>`to_char(${resources.created_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      })
      .from(resources)
      .where(eq(resources.is_public, true))
      .orderBy(desc(resources.created_at))
      .limit(5);
    return result;
  } catch {
    return [];
  }
}

async function getCounts() {
  try {
    const [noteCount] = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.is_public, true));
    const [workCount] = await db
      .select({ count: count() })
      .from(works)
      .where(eq(works.is_public, true));
    const [resourceCount] = await db
      .select({ count: count() })
      .from(resources)
      .where(eq(resources.is_public, true));
    return {
      notes: noteCount?.count || 0,
      works: workCount?.count || 0,
      resources: resourceCount?.count || 0,
    };
  } catch {
    return { notes: 0, works: 0, resources: 0 };
  }
}

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "..." : str;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(1)} ${units[unitIdx]}`;
}

export default async function HomePage() {
  const owner = await getOwnerProfile();
  const recentNotes = await getRecentNotes();
  const recentWorks = await getRecentWorks();
  const recentResources = await getRecentResources();
  const counts = await getCounts();

  const skills: string[] =
    owner?.skills && Array.isArray(owner.skills)
      ? (owner.skills as string[])
      : [];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero / Top Bar */}
      <div className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {owner?.name ? `${owner.name}的个人门户` : "个人综合服务门户"}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            {owner?.bio
              ? truncate(owner.bio, 80)
              : "记录学习笔记、展示作品成果、分享资源文件"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Owner Profile */}
          <aside className="lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
            {/* Profile Card */}
            <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted ring-4 ring-primary/10 mb-4">
                  {owner?.avatar_url ? (
                    <Image
                      src={owner.avatar_url}
                      alt={owner.name || "头像"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-3xl font-bold text-muted-foreground">
                        {owner?.name?.[0] || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {owner?.name || "站长"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {owner?.role === "admin" ? "管理员" : "用户"}
                </p>

                {owner?.bio && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {owner.bio}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {skills.slice(0, 8).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Social Links */}
                <div className="mt-5 flex items-center justify-center gap-3">
                  {owner?.github_url && (
                    <a
                      href={owner.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Github size={16} />
                    </a>
                  )}
                  {owner?.website_url && (
                    <a
                      href={owner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Globe size={16} />
                    </a>
                  )}
                  {owner?.linkedin_url && (
                    <a
                      href={owner.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Linkedin size={16} />
                    </a>
                  )}
                  {owner?.contact_email && (
                    <a
                      href={`mailto:${owner.contact_email}`}
                      className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                数据统计
              </h3>
              <div className="space-y-3">
                <Link
                  href="/notes"
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <BookOpen size={16} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      笔记
                    </span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {counts.notes}
                  </span>
                </Link>
                <Link
                  href="/works"
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Palette size={16} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      作品
                    </span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {counts.works}
                  </span>
                </Link>
                <Link
                  href="/resources"
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Database size={16} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      资源
                    </span>
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {counts.resources}
                  </span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Right: Content Feed */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Notes Section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    最新笔记
                  </h2>
                </div>
                <Link
                  href="/notes"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  查看全部
                  <ArrowRight size={14} />
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
                  <FileText size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    还没有发布笔记，去写点什么吧
                  </p>
                  <Link
                    href="/notes"
                    className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    创建笔记
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="group block bg-card rounded-xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-float transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <BookOpen size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {note.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {note.created_at
                                ? new Date(
                                    note.created_at || ""
                                  ).toLocaleDateString("zh-CN")
                                : ""}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {note.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {truncate(note.content || "", 140)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Works Section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Palette size={18} className="text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    最新作品
                  </h2>
                </div>
                <Link
                  href="/works"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  查看全部
                  <ArrowRight size={14} />
                </Link>
              </div>

              {recentWorks.length === 0 ? (
                <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
                  <Sparkles size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    还没有发布作品，来展示你的成果吧
                  </p>
                  <Link
                    href="/works"
                    className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    添加作品
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWorks.map((work) => (
                    <Link
                      key={work.id}
                      href={`/works/${work.id}`}
                      className="group block bg-card rounded-xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-float transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Code2 size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {work.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {work.created_at
                                ? new Date(
                                    work.created_at
                                  ).toLocaleDateString("zh-CN")
                                : ""}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {work.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {truncate(work.description || "", 140)}
                          </p>
                          {(() => {
                            const stack = work.tech_stack as string[] | null;
                            return stack && Array.isArray(stack) && stack.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {stack.slice(0, 4).map((tech: string) => (
                                  <span
                                    key={tech}
                                    className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Resources Section */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    最新资源
                  </h2>
                </div>
                <Link
                  href="/resources"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  查看全部
                  <ArrowRight size={14} />
                </Link>
              </div>

              {recentResources.length === 0 ? (
                <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
                  <Package size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    还没有上传资源，来分享你的文件吧
                  </p>
                  <Link
                    href="/resources"
                    className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    上传资源
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResources.map((resource) => (
                    <Link
                      key={resource.id}
                      href="/resources"
                      className="group block bg-card rounded-xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-float transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Box size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {resource.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {resource.created_at
                                ? new Date(
                                    resource.created_at || ""
                                  ).toLocaleDateString("zh-CN")
                                : ""}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {resource.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {truncate(resource.description || "", 140)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Download size={12} />
                              {resource.download_count || 0} 次下载
                            </span>
                            <span>{formatFileSize(resource.file_size)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
