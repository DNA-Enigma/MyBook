"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Mail, Github, Globe, Linkedin, Save, X } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetch(`/api/auth/me`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setProfile(d.user);
          setEditName(d.user.name || "");
          setEditBio(d.user.bio || "");
          setEditAvatar(d.user.avatar_url || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const res = await fetch(`/api/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        bio: editBio,
        avatar_url: editAvatar,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setEditing(false);
    } else {
      alert("保存失败");
    }
  };

  const skills = [
    "React", "TypeScript", "Node.js", "Next.js", "UI 设计",
    "摄影", "Tailwind CSS", "PostgreSQL", "Docker", "Go"
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <img
          src={profile?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"}
          alt="头像"
          className="h-24 w-24 rounded-full object-cover shadow-float"
        />
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-serif text-3xl font-bold text-primary">
            {profile?.name || "创作者"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "管理员 / 全栈开发者" : "用户"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            加入于 {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("zh-CN") : "-"}
          </p>
        </div>
        {user && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            编辑资料
          </Button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="mt-8 rounded-xl bg-card p-6 shadow-card">
          <h3 className="mb-4 font-semibold text-primary">编辑资料</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">昵称</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 bg-muted border-none rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">头像 URL</label>
              <Input
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://..."
                className="mt-1 bg-muted border-none rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">简介</label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={4}
                className="mt-1 bg-muted border-none rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-1.5 h-4 w-4" />
                取消
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bio */}
      <div className="mt-10 border-t border-border pt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-primary">个人简介</h2>
        <div className="space-y-3 text-base leading-relaxed text-foreground">
          {profile?.bio ? (
            profile.bio.split("\n\n").map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <>
              <p>
                我是一名热爱技术与设计的全栈开发者，专注于构建优雅、高性能的 Web 应用。
                多年来，我始终坚持将工程化思维与美学设计相结合，追求技术与艺术的完美平衡。
              </p>
              <p>
                在开发过程中，我注重代码质量与用户体验，善于运用现代化的技术栈解决复杂问题。
                同时，我也热衷于分享技术心得，通过写作与开源贡献回馈社区。
              </p>
              <p>
                工作之余，我喜欢摄影、阅读和探索新技术。我相信持续学习与跨界思考
                是保持创造力的关键。
              </p>
            </>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="mt-10 border-t border-border pt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-primary">技术栈</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-10 border-t border-border pt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-primary">联系方式</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={`mailto:${profile?.email || "hello@example.com"}`}
            className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
          >
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-sm text-foreground">{profile?.email || "hello@example.com"}</span>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
          >
            <Github className="h-5 w-5 text-primary" />
            <span className="text-sm text-foreground">GitHub</span>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
          >
            <Linkedin className="h-5 w-5 text-primary" />
            <span className="text-sm text-foreground">LinkedIn</span>
          </a>
          <a
            href="https://example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
          >
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-sm text-foreground">个人网站</span>
          </a>
        </div>
      </div>
    </div>
  );
}
