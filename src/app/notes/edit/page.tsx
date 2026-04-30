"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("技术");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    setLoading(true);
    fetch(`/api/notes/${noteId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.note) {
          setTitle(d.note.title);
          setContent(d.note.content);
          setCategory(d.note.category);
          setTags(d.note.tags?.join(", ") || "");
          setIsPublic(d.note.is_public);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [noteId]);

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
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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
            <Label htmlFor="tags">标签（逗号分隔）</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="React, 前端, 架构"
              className="mt-1.5 bg-muted border-none rounded-md"
            />
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
