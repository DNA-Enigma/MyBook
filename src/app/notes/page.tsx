"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Lock, Tag, User as UserIcon, X, Download, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  is_public: boolean;
  author_id: string;
  author?: { name: string | null; avatar_url: string | null };
}

const categories = ["全部", "技术", "生活", "设计", "随笔"];

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">加载中...</p></div>}>
      <NotesContent />
    </Suspense>
  );
}

function NotesContent() {
  const urlParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeTag, setActiveTag] = useState<string | null>(urlParams.get("tag"));
  const [activeAuthor, setActiveAuthor] = useState<string | null>(urlParams.get("author"));
  const { user, isAdmin } = useAuth();

  // 导入相关状态
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "全部") params.append("category", activeCategory);
    if (search) params.append("search", search);
    if (activeTag) params.append("tag", activeTag);
    if (activeAuthor) params.append("author", activeAuthor);
    const res = await fetch(`/api/notes?${params.toString()}`);
    const data = await res.json();
    setNotes(data.notes || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300);
    return () => clearTimeout(timer);
  }, [search, activeCategory, activeTag, activeAuthor]);

  const handleExportAll = async () => {
    const res = await fetch("/api/notes/export?format=markdown");
    if (!res.ok) {
      alert("导出失败");
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes_export_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      let body: Record<string, unknown> | null = null;
      let headers: Record<string, string> = {};

      // 尝试解析 JSON
      try {
        const parsed = JSON.parse(importText);
        if (Array.isArray(parsed)) {
          body = { notes: parsed };
        } else if (parsed.notes) {
          body = parsed;
        } else {
          body = { notes: [parsed] };
        }
        headers = { "Content-Type": "application/json" };
      } catch {
        // 作为 Markdown 导入
        body = null;
        headers = { "Content-Type": "text/markdown" };
      }

      const res = await fetch("/api/notes/import", {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : importText,
      });
      const data = await res.json();
      if (res.ok) {
        alert(`成功导入 ${data.imported} 篇笔记`);
        setImportOpen(false);
        setImportText("");
        fetchNotes();
      } else {
        alert(data.error || "导入失败");
      }
    } catch {
      alert("导入失败");
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown") && !file.name.endsWith(".txt") && !file.name.endsWith(".json")) {
      alert("请选择 .md / .txt / .json 文件");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setImportText(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 提取所有热门标签和创作者
  const { allTags, allAuthors } = useMemo(() => {
    const tagCount: Record<string, number> = {};
    const authorMap: Record<string, { name: string; count: number }> = {};
    notes.forEach((note) => {
      note.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
      if (note.author_id && note.author?.name) {
        if (!authorMap[note.author_id]) {
          authorMap[note.author_id] = { name: note.author.name, count: 0 };
        }
        authorMap[note.author_id].count++;
      }
    });
    const tags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
    const authors = Object.entries(authorMap)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([id, info]) => ({ id, name: info.name }));
    return { allTags: tags, allAuthors: authors };
  }, [notes]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-primary">笔记</h1>
          <p className="mt-2 text-muted-foreground">记录思考与灵感，沉淀有价值的内容</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportAll}>
                <Download className="mr-1.5 h-4 w-4" />
                导出
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="mr-1.5 h-4 w-4" />
                导入
              </Button>
            </>
          )}
          {user && (
            <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
              <Link href="/notes/edit">
                <Plus className="mr-1.5 h-4 w-4" />
                新建笔记
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            className="pl-9 bg-muted border-none rounded-md"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters */}
      {(activeTag || activeAuthor) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">当前筛选:</span>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <Tag className="h-3 w-3" /> {activeTag} <X className="h-3 w-3" />
            </button>
          )}
          {activeAuthor && (
            <button
              onClick={() => setActiveAuthor(null)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <UserIcon className="h-3 w-3" /> {
                allAuthors.find((a) => a.id === activeAuthor)?.name || "创作者"
              } <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => { setActiveTag(null); setActiveAuthor(null); setActiveCategory("全部"); setSearch(""); }}
            className="text-xs text-muted-foreground underline hover:text-primary"
          >
            清除全部
          </button>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && !activeTag && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Authors */}
      {allAuthors.length > 0 && !activeAuthor && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {allAuthors.slice(0, 8).map((author) => (
            <button
              key={author.id}
              onClick={() => setActiveAuthor(author.id)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/20"
            >
              <span className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {author.name?.[0] || "?"}
              </span>
              {author.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl bg-card py-20 text-center shadow-card">
          <p className="text-muted-foreground">暂无笔记</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="group flex flex-col rounded-xl bg-card p-6 shadow-card transition-all hover:shadow-float"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {note.category}
                </span>
                {!note.is_public && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" /> 私密
                  </span>
                )}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-primary group-hover:underline">
                {note.title}
              </h3>
              <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {note.content?.replace(/[#*`]/g, "").slice(0, 120)}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {note.tags?.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveTag(tag);
                    }}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Link
                  href={`/blog/${note.author_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {note.author?.name?.[0] || "?"}
                  </span>
                  {note.author?.name || "匿名"}
                </Link>
                <span>·</span>
                <span>{new Date(note.created_at).toLocaleDateString("zh-CN")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Import Dialog */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-dialog">
            <h3 className="mb-2 font-serif text-xl font-bold text-primary">导入笔记</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              支持导入 Markdown 文件（带 frontmatter）或 JSON 数组。JSON 格式: {"[{"}title, content, category, tags{"}]"}
            </p>
            <div className="mb-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                <Upload className="h-4 w-4" />
                选择文件导入
                <input
                  type="file"
                  accept=".md,.markdown,.txt,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
              <span className="ml-2 text-xs text-muted-foreground">.md / .txt / .json</span>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={'---\ntitle: "笔记标题"\ncategory: 技术\ntags: ["React", "前端"]\ndate: 2024-01-01\n---\n\n笔记内容...'}
              rows={10}
              className="w-full rounded-md bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setImportOpen(false); setImportText(""); }}>
                取消
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing || !importText.trim()} className="bg-primary text-primary-foreground">
                {importing ? "导入中..." : "确认导入"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
