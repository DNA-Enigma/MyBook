"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";

interface Work {
  id: string;
  title: string;
  description: string;
  category: string;
  tech_stack: string[];
  cover_image_url: string;
  external_link: string;
  created_at: string;
}

export default function WorkDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/works/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setWork(d.work);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个作品吗？")) return;
    const res = await fetch(`/api/works/${id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/works";
    } else {
      alert("删除失败");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="aspect-[21/9] animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 h-8 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-muted-foreground">作品不存在</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[21/9] w-full overflow-hidden">
        <img
          src={work.cover_image_url || "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=1200&h=500&fit=crop"}
          alt={work.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/works"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回作品列表
        </Link>

        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {work.category}
          </span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">
          {work.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {work.tech_stack?.map((tech) => (
            <span
              key={tech}
              className="rounded border border-border px-2.5 py-1 text-sm text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground">
          {work.description.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {work.external_link && (
          <div className="mt-8">
            <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <a href={work.external_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                查看项目
              </a>
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="mt-8 flex gap-2 border-t border-border pt-6">
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              删除
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
