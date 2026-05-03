import { db } from "@/lib/db";
import { profiles, notes, works, resources } from "@/storage/database/shared/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Github, Globe, Mail, Linkedin, FileText, ImageIcon, FolderOpen } from "lucide-react";
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
      {/* Hero */}
      <section className="relative border-b border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Button variant="ghost" size="sm" asChild className="mb-6 gap-1 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </Button>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-32 w-32 overflow-hidden border-4 border-background shadow-lg md:h-40 md:w-40">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || profile.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">
                    {(profile.name || profile.email || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {profile.name || "站长"}
                </h1>
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
                  站长
                </span>
              </div>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                {profile.bio || "热爱生活，热爱技术，在这里记录成长与思考。"}
              </p>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap justify-center gap-4 md:justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{stats.notes}</span>
                  <span className="text-sm text-muted-foreground">篇笔记</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-sm">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{stats.works}</span>
                  <span className="text-sm text-muted-foreground">个作品</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-sm">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{stats.resources}</span>
                  <span className="text-sm text-muted-foreground">个资源</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                {profile.github_url && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                )}
                {profile.website_url && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                      个人网站
                    </a>
                  </Button>
                )}
                {profile.linkedin_url && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {profile.contact_email && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={`mailto:${profile.contact_email}`}>
                      <Mail className="h-4 w-4" />
                      邮箱
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-xl font-bold text-foreground">技能标签</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">联系我</h2>
          <p className="mt-2 text-muted-foreground">
            有任何问题或合作意向，欢迎通过以下方式联系我
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {profile.contact_email && (
              <Button asChild className="gap-1.5">
                <a href={`mailto:${profile.contact_email}`}>
                  <Mail className="h-4 w-4" />
                  发送邮件
                </a>
              </Button>
            )}
            {profile.github_url && (
              <Button variant="outline" asChild className="gap-1.5">
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
