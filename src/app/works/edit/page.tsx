"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X, Upload, Link as LinkIcon, Image as ImageIcon, Code, GripVertical, Star } from "lucide-react";

interface ImageItem {
  url: string;
  file?: File;
  isCover: boolean;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("开发");
  const [workType, setWorkType] = useState("project");
  const [externalLink, setExternalLink] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customWorkType, setCustomWorkType] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

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
          // Load images from database
          const dbImages = Array.isArray(d.work.images) ? d.work.images : [];
          if (dbImages.length > 0) {
            setImages(dbImages.map((img: { url?: string } | string, i: number) => ({
              url: typeof img === "string" ? img : img.url || "",
              isCover: i === 0,
            })));
          } else if (d.work.cover_image_url) {
            setImages([{ url: d.work.cover_image_url, isCover: true }]);
          }
          setTechStack(Array.isArray(d.work.tech_stack) ? d.work.tech_stack : []);
          setIsPublic(d.work.is_public ?? true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workId, user?.id]);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: ImageItem[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newImages.push({ url, file, isCover: false });
    });
    setImages((prev) => {
      const updated = [...prev, ...newImages];
      // If no cover, set first as cover
      if (!updated.some((img) => img.isCover) && updated.length > 0) {
        updated[0].isCover = true;
      }
      return updated;
    });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSetCover = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isCover: i === index })));
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // If removed cover, set first as cover
      if (!updated.some((img) => img.isCover) && updated.length > 0) {
        updated[0].isCover = true;
      }
      return updated;
    });
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const uploadAllImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const img of images) {
      if (img.file) {
        const formData = new FormData();
        formData.append("file", img.file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("图片上传失败");
        const data = await res.json();
        uploadedUrls.push(data.publicUrl || data.url || "");
      } else {
        uploadedUrls.push(img.url);
      }
    }
    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("标题不能为空");
      return;
    }
    setSaving(true);
    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadAllImages();
      setUploadingImages(false);

      const imagePayload = uploadedUrls.map((url, i) => ({ url, isCover: images[i]?.isCover || i === 0 }));
      const coverUrl = imagePayload.find((img) => img.isCover)?.url || imagePayload[0]?.url || null;

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
          cover_image_url: coverUrl,
          images: imagePayload,
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
      setUploadingImages(false);
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

        {/* Multiple Images Section */}
        <div>
          <Label>作品图片 <span className="text-muted-foreground font-normal text-xs">（第一张为封面图）</span></Label>
          <div className="mt-2 space-y-3">
            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      img.isCover ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={img.url} alt={`图片 ${index + 1}`} className="h-full w-full object-cover" />
                    {/* Cover badge */}
                    {img.isCover && (
                      <div className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        封面
                      </div>
                    )}
                    {/* Actions overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(index)}
                          className="rounded bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/80"
                          title="设为封面"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, index - 1)}
                          className="rounded bg-muted p-1.5 text-foreground transition-colors hover:bg-muted/80"
                          title="左移"
                        >
                          <GripVertical className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(index, index + 1)}
                          className="rounded bg-muted p-1.5 text-foreground transition-colors hover:bg-muted/80"
                          title="右移"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="rounded bg-destructive p-1.5 text-destructive-foreground transition-colors hover:bg-destructive/80"
                        title="删除"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image Button */}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageAdd}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                添加图片
              </Button>
              <span className="text-xs text-muted-foreground">
                支持 jpg/png/gif/webp，第一张为封面图
              </span>
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
            {saving ? (uploadingImages ? "上传图片中..." : "保存中...") : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
