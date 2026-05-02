"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Mail, Github, Globe, Linkedin, Save, X, Upload, User } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar_url: string;
  role: string;
  skills: string[];
  contact_email: string;
  github_url: string;
  website_url: string;
  linkedin_url: string;
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
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

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
          setEditContactEmail(d.user.contact_email || "");
          setEditGithub(d.user.github_url || "");
          setEditWebsite(d.user.website_url || "");
          setEditLinkedin(d.user.linkedin_url || "");
          setEditRole(d.user.role || "");
          setEditSkills(Array.isArray(d.user.skills) ? d.user.skills : []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    let avatarUrl = editAvatar;
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      const uploadRes = await fetch(`/api/upload`, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        setSaving(false);
        alert("头像上传失败");
        return;
      }
      const uploadData = await uploadRes.json();
      avatarUrl = uploadData.publicUrl || uploadData.url || "";
    }
    const res = await fetch(`/api/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        bio: editBio,
        avatar_url: avatarUrl,
        role: editRole,
        skills: editSkills,
        contact_email: editContactEmail,
        github_url: editGithub,
        website_url: editWebsite,
        linkedin_url: editLinkedin,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
    } else {
      alert("保存失败");
    }
  };

  const defaultSkills = ["React", "TypeScript", "Node.js", "Next.js", "UI 设计", "摄影", "Tailwind CSS", "PostgreSQL", "Docker", "Go"];

  const displaySkills = profile?.skills?.length ? profile.skills : defaultSkills;

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
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="头像"
            className="h-24 w-24 rounded-full object-cover shadow-float"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"; }}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted shadow-float">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-serif text-3xl font-bold text-primary">
            {profile?.name || "创作者"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.role === "admin" ? "管理员" : profile?.role || "用户"}
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
              <label className="text-sm font-medium">头像</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
                  {(avatarPreview || editAvatar) ? (
                    <img
                      src={avatarPreview || editAvatar}
                      alt="头像预览"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                    <Upload className="h-4 w-4" />
                    选择图片
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatarPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {avatarFile && (
                    <span className="text-xs text-muted-foreground">{avatarFile.name}</span>
                  )}
                </div>
              </div>
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
            <div>
              <label className="text-sm font-medium">联系邮箱</label>
              <Input
                value={editContactEmail}
                onChange={(e) => setEditContactEmail(e.target.value)}
                placeholder="hello@example.com"
                className="mt-1 bg-muted border-none rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">身份标签</label>
              <Input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="如：全栈开发者 / 设计师 / 摄影师"
                className="mt-1 bg-muted border-none rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">技术栈 / 技能</label>
              <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2">
                {editSkills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {s}
                    <button type="button" onClick={() => setEditSkills((prev) => prev.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = skillInput.trim();
                      if (val && !editSkills.includes(val)) {
                        setEditSkills([...editSkills, val]);
                        setSkillInput("");
                      }
                    }
                  }}
                  placeholder="输入后按回车添加"
                  className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">GitHub</label>
                <Input
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="mt-1 bg-muted border-none rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">个人网站</label>
                <Input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 bg-muted border-none rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn</label>
              <Input
                value={editLinkedin}
                onChange={(e) => setEditLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
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
          {displaySkills.map((skill) => (
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
            href={`mailto:${profile?.contact_email || profile?.email || "hello@example.com"}`}
            className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
          >
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-sm text-foreground">{profile?.contact_email || profile?.email || "hello@example.com"}</span>
          </a>
          {profile?.github_url ? (
            <a
              href={profile.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
            >
              <Github className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">GitHub</span>
            </a>
          ) : null}
          {profile?.linkedin_url ? (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
            >
              <Linkedin className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">LinkedIn</span>
            </a>
          ) : null}
          {profile?.website_url ? (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card transition-all hover:shadow-float"
            >
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">个人网站</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
