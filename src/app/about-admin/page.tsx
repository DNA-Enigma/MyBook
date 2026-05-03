import { db } from "@/lib/db";
import { profiles } from "@/storage/database/shared/schema";
import { eq, sql } from "drizzle-orm";
import { Mail, Globe, Github, Linkedin, Calendar, MapPin, Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getAdminProfile() {
  try {
    const result = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
        bio: profiles.bio,
        skills: profiles.skills,
        avatar_url: profiles.avatar_url,
        contact_email: profiles.contact_email,
        github_url: profiles.github_url,
        website_url: profiles.website_url,
        linkedin_url: profiles.linkedin_url,
        created_at: sql<string>`to_char(${profiles.created_at}, 'YYYY-MM-DD')`,
      })
      .from(profiles)
      .where(eq(profiles.role, "admin"))
      .limit(1);
    return result[0] || null;
  } catch {
    return null;
  }
}

export default async function AboutAdminPage() {
  const admin = await getAdminProfile();

  if (!admin) {
    return (
      <main className="min-h-screen bg-background py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
            了解站长
          </h1>
          <p className="text-muted-foreground">暂无站长信息</p>
          <Link href="/">
            <Button className="mt-6 bg-primary text-white hover:opacity-90">
              返回首页
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const skills = admin.skills && typeof admin.skills === "string"
    ? admin.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-background py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Avatar className="w-28 h-28 mx-auto mb-6 ring-4 ring-primary/10">
            <AvatarImage src={admin.avatar_url || ""} alt={admin.name || "站长"} />
            <AvatarFallback className="bg-primary text-white text-3xl font-bold">
              {(admin.name?.[0] || "站").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
            {admin.name || "站长"}
          </h1>
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            站长
          </Badge>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {admin.bio || "热爱生活，热爱技术，乐于分享"}
          </p>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <Card className="mb-6 shadow-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase size={18} className="text-primary" />
                技能专长
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="px-3 py-1 text-sm border-primary/20 text-primary bg-primary/5"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        <Card className="mb-6 shadow-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail size={18} className="text-primary" />
              联系方式
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {admin.contact_email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{admin.contact_email}</span>
              </div>
            )}
            {admin.github_url && (
              <div className="flex items-center gap-3 text-sm">
                <Github size={16} className="text-muted-foreground shrink-0" />
                <a
                  href={admin.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {admin.github_url}
                </a>
              </div>
            )}
            {admin.website_url && (
              <div className="flex items-center gap-3 text-sm">
                <Globe size={16} className="text-muted-foreground shrink-0" />
                <a
                  href={admin.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {admin.website_url}
                </a>
              </div>
            )}
            {admin.linkedin_url && (
              <div className="flex items-center gap-3 text-sm">
                <Linkedin size={16} className="text-muted-foreground shrink-0" />
                <a
                  href={admin.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {admin.linkedin_url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Date */}
        <div className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
          <Calendar size={14} />
          {admin.created_at ? `${admin.created_at} 加入 Enigma 空间站` : "Enigma 空间站"}
        </div>
      </div>
    </main>
  );
}
