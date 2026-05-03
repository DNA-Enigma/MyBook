"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  User,
  Send,
  MessageCircle,
  FileText,
  Tag,
  Edit3,
  Trash2,
} from "lucide-react";

interface Blog {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  author_id: string;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string | null;
  author: { name: string | null; avatar_url: string | null; bio: string | null } | null;
}

interface Comment {
  id: string;
  blog_id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

export default function BlogDetailClient() {
  const searchParams = useSearchParams();
  const blogId = searchParams.get("blog_id");
  const mode = searchParams.get("mode");
  const { user } = useAuth();

  if (mode === "create" && user) {
    return <BlogEditor />;
  }
  if (!blogId) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-muted-foreground">请指定博客 ID</p>
        <Button asChild className="mt-4">
          <Link href="/blogs">返回博客列表</Link>
        </Button>
      </main>
    );
  }

  return <BlogContent blogId={blogId} />;
}

function BlogContent({ blogId }: { blogId: string }) {
  const { user } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchBlog = useCallback(async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}`);
      const data = await res.json();
      if (data.blog) setBlog(data.blog);
    } catch (err) {
      console.error("Fetch blog error:", err);
    }
  }, [blogId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  }, [blogId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBlog(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchBlog, fetchComments]);

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) return;
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });
      if (res.ok) {
        setCommentContent("");
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.error || "评论失败");
      }
    } catch (err) {
      alert("评论提交失败");
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parent_id: parentId }),
      });
      if (res.ok) {
        setReplyContent("");
        setReplyTo(null);
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.error || "回复失败");
      }
    } catch (err) {
      alert("回复提交失败");
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇博客吗？")) return;
    try {
      const res = await fetch(`/api/blogs/${blogId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/blogs";
      } else {
        alert("删除失败");
      }
    } catch {
      alert("删除失败");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-1/4 animate-pulse rounded bg-muted" />
        <div className="mt-8 aspect-video animate-pulse rounded-xl bg-muted" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-muted-foreground">博客不存在或已被删除</p>
        <Button asChild className="mt-4">
          <Link href="/blogs">返回博客列表</Link>
        </Button>
      </main>
    );
  }

  const isAuthor = user?.id === blog.author_id;
  const topComments = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  comments.filter((c) => c.parent_id).forEach((c) => {
    const list = repliesByParent.get(c.parent_id!) || [];
    list.push(c);
    repliesByParent.set(c.parent_id!, list);
  });

  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto max-w-4xl px-6 py-12">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="mb-6 gap-1">
          <Link href="/blogs">
            <ArrowLeft className="h-4 w-4" />
            返回博客列表
          </Link>
        </Button>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {blog.category}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {new Date(blog.created_at).toLocaleDateString("zh-CN")}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {blog.view_count} 阅读
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="h-3.5 w-3.5" />
              {blog.like_count} 赞
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {blog.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            {blog.author?.avatar_url ? (
              <img
                src={blog.author.avatar_url}
                alt={blog.author.name || ""}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {blog.author?.name || "匿名用户"}
              </p>
              <p className="text-xs text-muted-foreground">
                {blog.author?.bio || "热爱分享的技术人"}
              </p>
            </div>
            {isAuthor && (
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blog-detail?blog_id=${blog.id}&mode=edit`}>
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    编辑
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  删除
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Cover */}
        {blog.cover_image_url && (
          <div className="relative mb-10 aspect-video overflow-hidden rounded-xl bg-muted">
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(blog.content) }}
        />

        {/* Tags */}
        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Comments Section */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
            <MessageCircle className="h-5 w-5" />
            评论 ({comments.length})
          </h2>

          {/* Comment Input */}
          {user ? (
            <div className="mb-8 rounded-xl bg-card p-5 shadow-card">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="写下你的评论..."
                className="min-h-[100px] bg-muted border-none resize-none"
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={handleSubmitComment} disabled={!commentContent.trim()}>
                  <Send className="mr-1.5 h-4 w-4" />
                  发表评论
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl bg-card p-5 text-center shadow-card">
              <p className="text-muted-foreground">登录后可以发表评论</p>
              <Button asChild className="mt-3">
                <Link href="/login">去登录</Link>
              </Button>
            </div>
          )}

          {/* Comment List */}
          <div className="space-y-6">
            {topComments.length === 0 ? (
              <p className="text-center text-muted-foreground">暂无评论，来抢沙发吧</p>
            ) : (
              topComments.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-card p-5 shadow-card">
                  <div className="flex items-start gap-3">
                    {comment.author_avatar ? (
                      <img
                        src={comment.author_avatar}
                        alt={comment.author_name || ""}
                        className="h-9 w-9 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {comment.author_name || "匿名用户"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                      {user && (
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          回复
                        </button>
                      )}

                      {/* Reply Input */}
                      {replyTo === comment.id && (
                        <div className="mt-3">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`回复 ${comment.author_name || "匿名用户"}...`}
                            className="min-h-[80px] bg-muted border-none resize-none"
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyTo(null)}
                            >
                              取消
                            </Button>
                            <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                              发送回复
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {(repliesByParent.get(comment.id) || []).map((reply) => (
                        <div
                          key={reply.id}
                          className="mt-3 border-l-2 border-border pl-4"
                        >
                          <div className="flex items-start gap-2">
                            {reply.author_avatar ? (
                              <img
                                src={reply.author_avatar}
                                alt={reply.author_name || ""}
                                className="h-7 w-7 shrink-0 object-cover"
                              />
                            ) : (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-muted">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {reply.author_name || "匿名用户"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString("zh-CN")}
                                </span>
                              </div>
                              <p className="mt-0.5 text-sm text-foreground">{reply.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogEditor() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("blog_id");
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("技术分享");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editId) {
      fetch(`/api/blogs/${editId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.blog) {
            setTitle(data.blog.title);
            setContent(data.blog.content);
            setCategory(data.blog.category);
            setCoverUrl(data.blog.cover_image_url || "");
            setTags(Array.isArray(data.blog.tags) ? data.blog.tags.join(", ") : "");
          }
        });
    }
  }, [editId]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("标题和内容不能为空");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        title,
        content,
        category,
        cover_image_url: coverUrl || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const url = editId ? `/api/blogs/${editId}` : "/api/blogs";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/blog-detail?blog_id=${data.blog.id}`;
      } else {
        alert(data.error || "保存失败");
      }
    } catch {
      alert("保存失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-6 gap-1">
          <Link href="/blogs">
            <ArrowLeft className="h-4 w-4" />
            返回博客列表
          </Link>
        </Button>
        <h1 className="mb-8 font-serif text-3xl font-bold text-foreground">
          {editId ? "编辑博客" : "写博客"}
        </h1>
        <div className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">标题</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入标题"
              className="bg-muted border-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md bg-muted border-none px-3 py-2 text-sm text-foreground"
            >
              <option>技术分享</option>
              <option>问题讨论</option>
              <option>经验总结</option>
              <option>随笔</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">封面图 URL</label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="可选，输入图片 URL"
              className="bg-muted border-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">标签（用逗号分隔）</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：React, Next.js, 前端"
              className="bg-muted border-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">内容（支持 Markdown）</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在这里写下你的博客内容..."
              className="min-h-[400px] bg-muted border-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" asChild>
              <Link href="/blogs">取消</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "保存中..." : editId ? "更新" : "发布"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function renderMarkdown(content: string): string {
  if (!content) return "";
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-primary/40 pl-4 italic my-4 text-muted-foreground">$1</blockquote>')
    .replace(/\n/g, "<br>");
}
