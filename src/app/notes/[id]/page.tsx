"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Lock, Globe, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_public: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; avatar_url?: string };
}

export default function NoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setNote(d.note);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇笔记吗？此操作不可恢复。")) return;
    setDeleting(true);
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/notes");
    } else {
      setDeleting(false);
      alert("删除失败");
    }
  };

  const handleExport = async () => {
    if (!note) return;
    const res = await fetch(`/api/notes/export?id=${note.id}&format=markdown`);
    if (!res.ok) {
      alert("导出失败");
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^\w\u4e00-\u9fa5]/g, "_")}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isAdmin = user?.role === "admin";
  const canEdit = user && note && (isAdmin || user.id === note.author_id);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-1/4 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-muted-foreground">笔记不存在或已被删除</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/notes">返回笔记列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/notes"
        className="mb-6 inline-flex items-center text-sm text-foreground/80 hover:text-primary"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        返回笔记列表
      </Link>

      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {note.category}
        </span>
        {note.is_public ? (
          <span className="flex items-center gap-0.5 text-xs text-foreground/70">
            <Globe className="h-3 w-3" /> 公开
          </span>
        ) : (
          <span className="flex items-center gap-0.5 text-xs text-foreground/70">
            <Lock className="h-3 w-3" /> 私密
          </span>
        )}
      </div>

      <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">
        {note.title}
      </h1>

      <div className="mt-4 flex items-center gap-3 text-sm text-foreground/70">
        <span>{note.profiles?.name || "匿名"}</span>
        <span>·</span>
        <span>{new Date(note.created_at).toLocaleDateString("zh-CN")}</span>
        {note.updated_at !== note.created_at && (
          <>
            <span>·</span>
            <span>更新于 {new Date(note.updated_at).toLocaleDateString("zh-CN")}</span>
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {canEdit && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/notes/edit?id=${note.id}`}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                编辑
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {deleting ? "删除中..." : "删除"}
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-3.5 w-3.5" />
          导出 Markdown
        </Button>
      </div>

      <div className="prose prose-stone mt-8 max-w-none dark:prose-invert [&_p]:whitespace-pre-wrap">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
      </div>

      {note.tags?.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          {note.tags.map((tag) => (
            <Link
              key={tag}
              href={`/notes?tag=${encodeURIComponent(tag)}`}
              className="rounded bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
