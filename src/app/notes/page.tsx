"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Lock } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  is_public: boolean;
  profiles?: { name: string };
}

const categories = ["全部", "技术", "生活", "设计", "随笔"];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "全部") params.append("category", activeCategory);
    if (search) params.append("search", search);
    const res = await fetch(`/api/notes?${params.toString()}`);
    const data = await res.json();
    setNotes(data.notes || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300);
    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-primary">笔记</h1>
          <p className="mt-2 text-muted-foreground">记录思考与灵感，沉淀有价值的内容</p>
        </div>
        {user && (
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link href="/notes/edit">
              <Plus className="mr-1.5 h-4 w-4" />
              新建笔记
            </Link>
          </Button>
        )}
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
                  <span
                    key={tag}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {note.profiles?.name || "匿名"} · {new Date(note.created_at).toLocaleDateString("zh-CN")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
