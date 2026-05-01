"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X } from "lucide-react";

const categories = ["技术", "生活", "设计", "随笔"];

export default function NoteEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("id");
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("技术");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    setForbidden(false);
    setLoading(true);
    fetch(`/api/notes/${noteId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.note) {
          const isAdmin = user?.role === "admin";
          if (d.note.author_id !== user?.id && !isAdmin) {
            setForbidden(true);
            setLoading(false);
            return;
          }
          setTitle(d.note.title);
          setContent(d.note.content);
          setCategory(d.note.category);
          setTags(Array.isArray(d.note.tags) ? d.note.tags : []);
          setIsPublic(d.note.is_public);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [noteId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (forbidden) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-destructive">无权编辑</h1>
        <p className="mt-2 text-muted-foreground">您没有权限编辑这篇笔记</p>
        <Button variant="outline" asChild className="mt-6">
          <Link href="/notes">返回笔记列表</Link>
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("标题和内容不能为空");
      return;
    }
    setSaving(true);
    const url = noteId ? `/api/notes/${noteId}` : "/api/notes";
    const method = noteId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        category,
        tags,
        is_public: isPublic,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/notes/${data.note?.id || noteId}`);
    } else {
      const err = await res.json();
      alert(err.error || "保存失败");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/notes"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Link>
        <h1 className="font-serif text-2xl font-bold text-primary">
          {noteId ? "编辑笔记" : "新建笔记"}
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入笔记标题"
            className="mt-1.5 bg-muted border-none rounded-md text-lg"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-md bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>标签</Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="rounded-full hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = tagInput.trim();
                    if (val && !tags.includes(val)) {
                      setTags([...tags, val]);
                      setTagInput("");
                    }
                  }
                  if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                placeholder={tags.length === 0 ? "输入标签按回车添加" : ""}
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
          <Label htmlFor="public" className="cursor-pointer">
            {isPublic ? "公开笔记" : "私密笔记"}
          </Label>
        </div>

        <div>
          <Label htmlFor="content">内容（支持 Markdown）</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在这里写下你的思考..."
            rows={20}
            className="mt-1.5 bg-muted border-none rounded-md font-mono text-sm leading-relaxed"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/notes">
              <X className="mr-1.5 h-4 w-4" />
              取消
            </Link>
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
