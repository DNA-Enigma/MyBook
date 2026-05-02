"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Mail, Github, Globe, Linkedin, Save, X, Upload, User, Crop } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

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

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/png");
    };
    image.onerror = reject;
  });
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

  // Avatar crop states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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

    // Upload cropped avatar if we have one
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropSrc(reader.result as string);
        setCropModalOpen(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.png", { type: "image/png" });
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(blob);
      setAvatarPreview(previewUrl);
      setCropModalOpen(false);
    } catch {
      alert("裁剪失败，请重试");
    }
  };

  const displaySkills = profile?.skills?.length ? profile.skills : [];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-6">
          <div className="h-32 w-32 animate-pulse rounded-xl bg-muted" />
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
      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-lg rounded-xl bg-card p-4 shadow-float">
            <h3 className="mb-3 text-center font-semibold text-primary">裁剪头像</h3>
            <div className="relative h-80 w-full rounded-lg bg-black">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">缩放:</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCropModalOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleCropConfirm} className="bg-primary text-primary-foreground">
                确认裁剪
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="头像"
            className="h-32 w-32 rounded-xl object-cover shadow-float"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
          />
        ) : null}
        <div className={`flex h-32 w-32 items-center justify-center rounded-xl bg-muted shadow-float ${profile?.avatar_url ? "hidden" : ""}`}>
          <User className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-serif text-3xl font-bold text-primary">
            {profile?.name || "创作者"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.role || "用户"}
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
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-muted">
                  {(avatarPreview || editAvatar) ? (
                    <img
                      src={avatarPreview || editAvatar}
                      alt="头像预览"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <User className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors">
                    <Crop className="h-4 w-4" />
                    选择并裁剪图片
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  {avatarFile && (
                    <span className="text-xs text-muted-foreground">已裁剪，点击可重新裁剪</span>
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
            <p className="text-muted-foreground">暂无简介</p>
          )}
        </div>
      </div>

      {/* Skills */}
      {displaySkills.length > 0 && (
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
      )}

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
