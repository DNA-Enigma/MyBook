"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Mail,
  Globe,
  Github,
  Linkedin,
  Edit3,
  X,
  ImageIcon,
  FolderOpen,
  User,
} from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  contact_email: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  created_at: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

interface Work {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  category: string;
  created_at: string;
}

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const isOwner = user?.id === id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, notesRes, worksRes] = await Promise.all([
        fetch(`/api/profile/public?user_id=${id}`),
        fetch(`/api/notes?author=${id}&is_public=true`),
        fetch(`/api/works?author=${id}`),
      ]);

      const profileData = await profileRes.json();
      const notesData = await notesRes.json();
      const worksData = await worksRes.json();

      if (profileData.profile) setProfile(profileData.profile);
      if (notesData.notes) setNotes(notesData.notes);
      if (worksData.works) setWorks(worksData.works);
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-20 w-20 animate-pulse bg-muted" />
        <div className="mt-4 h-8 w-48 animate-pulse bg-muted" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-muted-foreground">用户不存在</p>
        <Button asChild className="mt-4">
          <Link href="/">返回首页</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/notes"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回笔记广场
        </Link>

        {/* Profile Header */}
        <div className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Square Avatar */}
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              <div className="h-28 w-28 overflow-hidden border-4 border-background shadow-lg sm:h-36 sm:w-36">
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || ""}
                  width={144}
                  height={144}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center border-4 border-background bg-primary/10 text-3xl font-bold text-primary shadow-lg sm:h-36 sm:w-36">
                {profile.name?.[0] || "?"}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
              <h1 className="font-serif text-3xl font-bold text-foreground">
                {profile.name || "匿名创作者"}
              </h1>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEdit(true)}
                  className="gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  编辑资料
                </Button>
              )}
            </div>
            {profile.bio && (
              <p className="mt-2 max-w-xl text-muted-foreground">{profile.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {notes.length} 篇笔记
              </span>
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                {works.length} 个作品
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
                  <Mail className="h-3.5 w-3.5" /> 邮箱
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
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Notes Column */}
          <div>
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
              公开笔记
            </h2>
            <ScrollList items={notes} type="note" />
          </div>

          {/* Works Column */}
          <div>
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
              公开作品
            </h2>
            <ScrollList items={works} type="work" />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && isOwner && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onUpdated={fetchData}
        />
      )}
    </main>
  );
}

function ScrollList({ items, type }: { items: (Note | Work)[]; type: "note" | "work" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length <= 1) return;

    let animationId: number;
    let scrollPos = 0;
    const speed = 0.5;

    const animate = () => {
      scrollPos += speed;
      if (scrollPos >= container.scrollHeight / 2) {
        scrollPos = 0;
      }
      container.scrollTop = scrollPos;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-card py-12 text-center shadow-card">
        <p className="text-muted-foreground">暂无{type === "note" ? "笔记" : "作品"}</p>
      </div>
    );
  }

  const displayItems = items.length > 1 ? [...items, ...items] : items;

  return (
    <div
      ref={containerRef}
      className="h-[400px] overflow-hidden rounded-xl bg-card shadow-card"
    >
      <div className="space-y-3 p-4">
        {displayItems.map((item, idx) =>
          type === "note" ? (
            <Link
              key={`${item.id}-${idx}`}
              href={`/notes/${item.id}`}
              className="block rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {(item as Note).category}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {(item as Note).content?.replace(/[#*`]/g, "").slice(0, 120) || "暂无摘要"}
              </p>
            </Link>
          ) : (
            <Link
              key={`${item.id}-${idx}`}
              href={`/works/${item.id}`}
              className="block rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                {(item as Work).cover_image_url ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-muted">
                    <Image
                      src={(item as Work).cover_image_url!}
                      alt={item.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-muted">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {(item as Work).description || "暂无描述"}
                  </p>
                  <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {(item as Work).category}
                  </span>
                </div>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onUpdated,
}: {
  profile: Profile;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [contactEmail, setContactEmail] = useState(profile.contact_email || "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.publicUrl) {
        setAvatarUrl(data.publicUrl);
      } else {
        alert(data.error || "上传失败");
      }
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          avatar_url: avatarUrl || null,
          contact_email: contactEmail || null,
          website_url: websiteUrl || null,
          github_url: githubUrl || null,
          linkedin_url: linkedinUrl || null,
        }),
      });
      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-float">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">编辑资料</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar Upload */}
        <div className="mb-6 flex flex-col items-center">
          <div
            className="relative h-28 w-28 cursor-pointer overflow-hidden border-4 border-background shadow-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="头像预览"
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs">
                上传中...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-sm text-primary hover:underline"
          >
            {avatarUrl ? "更换头像" : "上传头像"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">姓名</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">简介</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-muted border-none resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">联系邮箱</label>
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="bg-muted border-none"
              type="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">个人网站</label>
            <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-muted border-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">GitHub</label>
            <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="bg-muted border-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">LinkedIn</label>
            <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="bg-muted border-none" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
