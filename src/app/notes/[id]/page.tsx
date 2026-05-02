"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Lock, Globe, Download, List } from "lucide-react";
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

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const MAX_DISPLAY_CHARS = 1000;

export default function NoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [activeHeading, setActiveHeading] = useState("");

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

  // Extract TOC from markdown headings
  const tocItems: TocItem[] = useMemo(() => {
    if (!note?.content) return [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    const usedIds = new Set<string>();
    let match;
    while ((match = headingRegex.exec(note.content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      // Generate stable id: use index-based suffix to guarantee uniqueness
      let baseId = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, "");
      // Ensure non-empty id for Chinese-only headings
      if (!baseId) {
        baseId = `heading-${items.length}`;
      }
      // Deduplicate ids
      let finalId = baseId;
      let counter = 1;
      while (usedIds.has(finalId)) {
        finalId = `${baseId}-${counter}`;
        counter++;
      }
      usedIds.add(finalId);
      items.push({ id: finalId, text, level });
    }
    return items;
  }, [note?.content]);

  // Inject ids into rendered headings and keep a map of text→id
  const headingIdMap = useMemo(() => {
    const map = new Map<string, string>();
    tocItems.forEach((item) => {
      map.set(item.text, item.id);
    });
    return map;
  }, [tocItems]);

  useEffect(() => {
    if (tocItems.length === 0) return;
    const timer = setTimeout(() => {
      const proseEl = document.querySelector(".note-content");
      if (!proseEl) return;
      const headings = proseEl.querySelectorAll("h1, h2, h3");
      headings.forEach((heading) => {
        const text = heading.textContent?.trim() || "";
        const mappedId = headingIdMap.get(text);
        if (mappedId) {
          heading.id = mappedId;
        } else {
          // Fallback: generate id same way as tocItems
          const generatedId = text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
            .replace(/^-|-$/g, "") || `heading-${Math.random().toString(36).slice(2, 8)}`;
          heading.id = generatedId;
        }
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [tocItems, headingIdMap]);

  // Intersection observer for active heading tracking — observe within the scroll container
  useEffect(() => {
    if (tocItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      {
        root: document.querySelector(".note-content") || null,
        rootMargin: "-10px 0px -60% 0px",
      }
    );
    const timer = setTimeout(() => {
      tocItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 600);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [tocItems]);

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

  const handleTocClick = (tocId: string) => {
    const el = document.getElementById(tocId);
    const container = document.querySelector(".note-content");
    if (el && container) {
      // Scroll within the content container, not the document
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollOffset = elRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({ top: scrollOffset - 10, behavior: "smooth" });
      setActiveHeading(tocId);
    }
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

  const isLongContent = note.content.length > MAX_DISPLAY_CHARS;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
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

      {/* Content with TOC sidebar */}
      <div className="mt-8 flex gap-8">
        {/* TOC Sidebar */}
        {tocItems.length > 0 && showToc && (
          <nav className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-primary">
                <List className="h-4 w-4" />
                目录
              </div>
              <ul className="space-y-1 border-l border-border pl-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleTocClick(item.id)}
                      className={`block w-full text-left text-sm py-1 transition-colors hover:text-primary ${
                        item.level === 2 ? "pl-2" : item.level === 3 ? "pl-4" : ""
                      } ${
                        activeHeading === item.id
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}

        {/* TOC toggle for mobile / small screens */}
        {tocItems.length > 0 && (
          <button
            onClick={() => setShowToc(!showToc)}
            className="lg:hidden fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float hover:bg-primary/90"
            title={showToc ? "隐藏目录" : "显示目录"}
          >
            <List className="h-5 w-5" />
          </button>
        )}

        {/* Mobile TOC dropdown */}
        {tocItems.length > 0 && showToc && (
          <div className="lg:hidden fixed bottom-20 right-6 z-40 w-56 rounded-xl bg-card p-3 shadow-float border border-border">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary">
              <List className="h-4 w-4" />
              目录
            </div>
            <ul className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => { handleTocClick(item.id); setShowToc(false); }}
                    className={`block w-full text-left text-sm py-1 transition-colors hover:text-primary ${
                      item.level === 2 ? "pl-2" : item.level === 3 ? "pl-4" : ""
                    } ${
                      activeHeading === item.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content area with scroll limit */}
        <div className="flex-1 min-w-0">
          <div
            className={`note-content prose prose-stone max-w-none dark:prose-invert [&_p]:whitespace-pre-wrap ${
              isLongContent ? "max-h-[600px] overflow-y-auto pr-2" : ""
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          </div>
          {isLongContent && (
            <div className="mt-2 text-center text-xs text-muted-foreground">
              内容较长，已启用滚动浏览 · 共 {note.content.length} 字
            </div>
          )}
        </div>
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
