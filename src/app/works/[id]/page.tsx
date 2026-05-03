"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

interface ImageItem {
  url: string;
  isCover?: boolean;
}

interface Work {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  images: ImageItem[] | null;
  category: string;
  work_type: string;
  tech_stack: string[];
  external_link: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: { name: string } | null;
}

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const workId = params.id as string;

  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState<Set<number>>(new Set());

  const getImages = (w: Work): ImageItem[] => {
    if (Array.isArray(w.images) && w.images.length > 0) {
      return w.images;
    }
    if (w.cover_image_url) {
      return [{ url: w.cover_image_url, isCover: true }];
    }
    return [];
  };

  useEffect(() => {
    fetch(`/api/works/${workId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.work) {
          setWork(d.work);
          // Set initial image to cover
          const imgs = getImages(d.work);
          if (imgs.length > 0) {
            const coverIdx = imgs.findIndex((img: ImageItem) => img.isCover);
            setCurrentImage(coverIdx >= 0 ? coverIdx : 0);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workId]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个作品吗？")) return;
    const res = await fetch(`/api/works/${workId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/works");
    } else {
      const data = await res.json();
      alert(data.error || "删除失败");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold">作品未找到</h1>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  const images = getImages(work);
  const canEdit = user?.id === work.author_id || user?.role === "admin";
  const coverImageUrl = work.cover_image_url || (images.length > 0 ? images.find((img) => img.isCover)?.url || images[0]?.url : null);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/works" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Link>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/works/edit?id=${work.id}`}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                编辑
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              删除
            </Button>
          </div>
        )}
      </div>

      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="relative mb-8 overflow-hidden rounded-xl bg-muted">
          {/* Main Image */}
          <div className="relative aspect-video w-full">
            <img
              src={images[currentImage]?.url}
              alt={`${work.title} - 图片 ${currentImage + 1}`}
              className="h-full w-full object-contain"
              onLoad={() => setImageLoaded((prev) => new Set(prev).add(currentImage))}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {currentImage + 1} / {images.length}
              </div>
            )}

            {/* Cover Indicator */}
            {images[currentImage]?.isCover && (
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
                <Star className="h-3 w-3" />
                封面
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    idx === currentImage
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <img src={img.url} alt={`缩略图 ${idx + 1}`} className="h-14 w-20 object-cover" />
                  {img.isCover && (
                    <div className="absolute top-0 right-0 rounded-bl bg-primary px-1 py-0.5 text-[8px] text-primary-foreground">
                      封面
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fallback: single cover image if no images array */}
      {images.length === 0 && coverImageUrl && (
        <div className="mb-8 overflow-hidden rounded-xl bg-muted">
          <img src={coverImageUrl} alt={work.title} className="aspect-video w-full object-contain" />
        </div>
      )}

      {/* Work Info */}
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">{work.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {work.category}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {work.work_type === "website" ? "网址链接" : work.work_type === "photography" ? "摄影集" : work.work_type === "design" ? "设计方案" : "项目介绍"}
            </span>
            <span>{new Date(work.created_at).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>

        {/* Tech Stack */}
        {work.tech_stack && work.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {work.tech_stack.map((tech) => (
              <span key={tech} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* External Link */}
        {work.external_link && (
          <a
            href={work.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <ExternalLink className="h-4 w-4" />
            访问项目
          </a>
        )}

        {/* Description */}
        {work.description && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap rounded-xl bg-muted/50 p-6 text-foreground/90 leading-relaxed">
              {work.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
