"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X, Upload, Link as LinkIcon, Image as ImageIcon, Code } from "lucide-react";

const defaultCategories = ["设计", "开发", "摄影", "写作", "项目", "其他"];
const defaultWorkTypes = [
  { value: "project", label: "项目介绍", icon: Code },
  { value: "website", label: "网址链接", icon: LinkIcon },
  { value: "photography", label: "摄影集", icon: ImageIcon },
  { value: "design", label: "设计方案", icon: ImageIcon },
];

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">加载中...</p></div>}>
      <WorkEditPage />
    </Suspense>
  );
}

function WorkEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = searchParams.get("id");
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("开发");
  const [workType, setWorkType] = useState("project");
  const [externalLink, setExternalLink] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customWorkType, setCustomWorkType] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!workId) return;
    setForbidden(false);
    setLoading(true);
    fetch(`/api/works/${workId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.work) {
          const isAdmin = user?.role === "admin";
          if (d.work.author_id !== user?.id && !isAdmin) {
            setForbidden(true);
            setLoading(false);
            return;
          }
          setTitle(d.work.title || "");
          setDescription(d.work.description || "");
          setCategory(d.work.category || "开发");
          setWorkType(d.work.work_type || "project");
          setExternalLink(d.work.external_link || "");
          setCoverUrl(d.work.cover_image_url || "");
          setCoverPreview(d.work.cover_image_url || "");
          setTechStack(Array.isArray(d.work.tech_stack) ? d.work.tech_stack : []);
          setIsPublic(d.work.is_public ?? true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workId, user?.id]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadCover = async (): Promise<string> => {
    if (!coverFile) return coverUrl;
    const formData = new FormData();
    formData.append("file", coverFile);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("封面上传失败");
    const data = await res.json();
    return data.publicUrl || data.url || "";
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("标题不能为空");
      return;
    }
    setSaving(true);
    try {
      const finalCover = await uploadCover();
      const url = workId ? `/api/works/${workId}` : "/api/works";
      const method = workId ? "PUT" : "POST";
      const finalCategory = category === "__custom__" ? customCategory.trim() || "其他" : category;
      const finalWorkType = workType === "__custom__" ? customWorkType.trim() || "project" : workType;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: finalCategory,
          work_type: finalWorkType,
          external_link: externalLink || null,
          cover_image_url: finalCover || null,
          tech_stack: techStack,
          is_public: isPublic,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/works/${data.work?.id || workId}`);
      } else {
        const err = await res.json();
        alert(err.error || "保存失败");
        setSaving(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
      setSaving(false);
    }
  };

  if (forbidden) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-destructive">无权编辑</h1>
        <p className="mt-2 text-muted-foreground">您没有权限编辑这个作品</p>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/works" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Link>
        <h1 className="font-serif text-2xl font-bold text-primary">
          {workId ? "编辑作品" : "新建作品"}
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入作品标题"
            className="mt-1.5 bg-muted border-none rounded-md text-lg"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">分类</Label>
            <div className="mt-1.5 flex gap-2">
              <select
                id="category"
                value={category}
                onChange={(e) => { setCategory(e.target.value); if (e.target.value !== "__custom__") setCustomCategory(""); }}
                className="flex-1 rounded-md bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {defaultCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__custom__">自定义...</option>
              </select>
            </div>
            {category === "__custom__" && (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="输入自定义分类"
                className="mt-2 bg-muted border-none rounded-md"
              />
            )}
          </div>
          <div>
            <Label htmlFor="workType">作品类型</Label>
            <div className="mt-1.5 flex gap-2">
              <select
                id="workType"
                value={workType}
                onChange={(e) => { setWorkType(e.target.value); if (e.target.value !== "__custom__") setCustomWorkType(""); }}
                className="flex-1 rounded-md bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                {defaultWorkTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
                <option value="__custom__">自定义...</option>
              </select>
            </div>
            {workType === "__custom__" && (
              <Input
                value={customWorkType}
                onChange={(e) => setCustomWorkType(e.target.value)}
                placeholder="输入自定义类型"
                className="mt-2 bg-muted border-none rounded-md"
              />
            )}
          </div>
        </div>

        {workType === "website" && (
          <div>
            <Label htmlFor="externalLink">网址链接</Label>
            <Input
              id="externalLink"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://example.com"
              className="mt-1.5 bg-muted border-none rounded-md"
            />
          </div>
        )}

        <div>
          <Label>封面图</Label>
          <div className="mt-1.5 flex items-center gap-4">
            <div
              className="relative h-24 w-24 rounded-lg border border-border bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30"
              onClick={() => document.getElementById("cover-upload")?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="预览" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("cover-upload")?.click()}
              >
                <Upload className="mr-1 h-4 w-4" />
                选择图片
              </Button>
              {coverPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-destructive"
                  onClick={() => { setCoverFile(null); setCoverPreview(""); setCoverUrl(""); }}
                >
                  <X className="mr-1 h-4 w-4" />
                  清除
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label>技术栈 / 标签</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2">
            {techStack.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {t}
                <button type="button" onClick={() => setTechStack((prev) => prev.filter((x) => x !== t))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = techInput.trim();
                  if (val && !techStack.includes(val)) {
                    setTechStack([...techStack, val]);
                    setTechInput("");
                  }
                }
              }}
              placeholder="输入后按回车添加"
              className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">作品介绍</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="介绍你的作品..."
            rows={8}
            className="mt-1.5 bg-muted border-none rounded-md whitespace-pre-wrap"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
          <Label htmlFor="isPublic" className="cursor-pointer">
            {isPublic ? "公开发布" : "仅自己可见"}
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" asChild>
            <Link href="/works">取消</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
