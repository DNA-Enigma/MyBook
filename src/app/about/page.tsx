import { db } from "@/lib/db";
import { profiles, notes, works, resources } from "@/storage/database/shared/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Github, Globe, Mail, Linkedin, FileText, ImageIcon, FolderOpen, Code2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

// 强制动态渲染，避免构建时数据库不可用导致数据为空
export const dynamic = "force-dynamic";

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

export default async function AboutPage() {
  const [profile, stats] = await Promise.all([getOwnerProfile(), getStats()]);

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">暂无站长信息</h1>
        <p className="mt-2 text-muted-foreground">站长还没有完善个人资料</p>
      </main>
    );
  }

  const skills = profile.skills ? String(profile.skills).split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <main className="min-h-screen bg-background">
      {/* Back */}
      <div className="mx-auto max-w-5xl px-6 pt-8">
        <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>

      {/* Hero - Name Card Style */}
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {/* Top Banner */}
          <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />

          {/* Avatar + Info */}
          <div className="relative px-8 pb-8">
            {/* Avatar overlapping the banner */}
            <div className="-mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
              <div className="h-28 w-28 shrink-0 overflow-hidden border-4 border-card bg-muted shadow-lg sm:h-32 sm:w-32">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || profile.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-muted-foreground">
                    {(profile.name || profile.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center sm:mb-2 sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {profile.name || "站长"}
                  </h1>
                  <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
                    站长
                  </span>
                </div>
                {profile.bio && (
                  <p className="mt-2 max-w-xl text-muted-foreground">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.notes}</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  篇笔记
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.works}</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  个作品
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.resources}</div>
                <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  个资源
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact - Prominent Email & GitHub */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-xl font-bold text-foreground">联系站长</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.contact_email && (
            <a
              href={`mailto:${profile.contact_email}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">发送邮件</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{profile.contact_email}</div>
              </div>
            </a>
          )}
          {profile.github_url && (
            <a
              href={profile.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Github className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">GitHub</div>
                <div className="mt-0.5 text-sm text-muted-foreground">查看开源项目</div>
              </div>
            </a>
          )}
          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">个人网站</div>
                <div className="mt-0.5 text-sm text-muted-foreground">访问个人主页</div>
              </div>
            </a>
          )}
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Linkedin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">LinkedIn</div>
                <div className="mt-0.5 text-sm text-muted-foreground">职业社交</div>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <h2 className="mb-4 text-xl font-bold text-foreground">技能标签</h2>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Code2 className="h-3.5 w-3.5" />
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">想了解更多？</h2>
          <p className="mt-2 text-muted-foreground">
            浏览我的笔记、作品和资源，或直接通过邮件联系我
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="gap-1.5">
              <Link href="/blogs">
                <FileText className="h-4 w-4" />
                看博客
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-1.5">
              <Link href="/works">
                <ImageIcon className="h-4 w-4" />
                看作品
              </Link>
            </Button>
            {profile.contact_email && (
              <Button variant="outline" asChild className="gap-1.5">
                <a href={`mailto:${profile.contact_email}`}>
                  <Mail className="h-4 w-4" />
                  发邮件
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
