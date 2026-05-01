import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { notes, profiles } from "@/storage/database/shared/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { ArrowLeft, BookOpen, Calendar, Mail, Globe } from "lucide-react";

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;

  // 获取用户资料
  const userProfile = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      bio: profiles.bio,
      avatar_url: profiles.avatar_url,
      contact_email: profiles.contact_email,
      website_url: profiles.website_url,
      created_at: sql<string>`to_char(${profiles.created_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
    })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!userProfile.length) {
    notFound();
  }

  const profile = userProfile[0];

  // 获取该用户的所有公开笔记
  const userNotes = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      category: notes.category,
      tags: notes.tags,
      created_at: sql<string>`to_char(${notes.created_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
    })
    .from(notes)
    .where(and(eq(notes.author_id, id), eq(notes.is_public, true)))
    .orderBy(desc(notes.created_at));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/notes"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回笔记广场
      </Link>

      {/* Profile Header */}
      <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
          {profile.name?.[0] || "?"}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-serif text-3xl font-bold text-primary">
            {profile.name || "匿名创作者"}
          </h1>
          {profile.bio && (
            <p className="mt-2 max-w-lg text-muted-foreground">{profile.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {userNotes.length} 篇笔记
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              加入于 {new Date(profile.created_at).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {profile.contact_email && (
              <a
                href={`mailto:${profile.contact_email}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> 联系
              </a>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Globe className="h-3.5 w-3.5" /> 网站
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <h2 className="mb-6 font-serif text-2xl font-bold text-primary">公开笔记</h2>
      {userNotes.length === 0 ? (
        <div className="rounded-xl bg-card py-16 text-center shadow-card">
          <p className="text-muted-foreground">该创作者暂无公开笔记</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userNotes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="block rounded-xl bg-card p-6 shadow-card transition-all hover:shadow-float"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {note.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary hover:underline">
                {note.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {note.content?.replace(/[#*`]/g, "").slice(0, 160) || "暂无摘要"}
              </p>
              {Array.isArray(note.tags) && note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(note.tags as string[]).map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
