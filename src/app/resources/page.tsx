"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Download, Copy, FileText, Image, Box, Package, Archive, FileCode, CheckCircle, XCircle, Clock } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  file_url: string;
  file_key: string | null;
  file_size: number | null;
  file_type: string;
  docker_pull_cmd: string | null;
  download_count: number;
  created_at: string;
}

const categories = ["全部", "软件", "文档", "图片媒体", "Docker镜像", "安装包", "压缩包", "源码", "其他"];

const categoryIcons: Record<string, typeof Package> = {
  软件: Package,
  文档: FileText,
  图片媒体: Image,
  Docker镜像: Box,
  安装包: Package,
  压缩包: Archive,
  源码: FileCode,
  其他: Package,
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const { user, isAdmin } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);

  const fetchResources = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "全部") params.append("category", activeCategory);
    if (search) params.append("search", search);
    const res = await fetch(`/api/resources?${params.toString()}`);
    const data = await res.json();
    setResources(data.resources || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchResources, 300);
    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  const handleDownload = async (resource: Resource) => {
    const key = resource.file_key || resource.file_url;
    if (!key) {
      alert("资源文件不存在");
      return;
    }
    const res = await fetch(`/api/download?key=${encodeURIComponent(key)}&name=${encodeURIComponent(resource.name)}`);
    if (res.ok) {
      const { url } = await res.json();
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = resource.name;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-primary">资源库</h1>
          <p className="mt-2 text-muted-foreground">汇集软件、文档、媒体素材与 Docker 镜像</p>
        </div>
        {user && (
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            上传资源
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索资源..."
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl bg-card py-20 text-center shadow-card">
          <p className="text-muted-foreground">暂无资源</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">资源名称</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">分类</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">大小</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">下载</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => {
                const Icon = categoryIcons[resource.category] || Package;
                return (
                  <tr key={resource.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-primary">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                          {resource.category === "Docker镜像" && (
                            <code className="mt-1 block rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                              {resource.docker_pull_cmd || `docker pull ${resource.file_url}`}
                            </code>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {resource.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{resource.file_size ? `${(resource.file_size / 1024 / 1024).toFixed(1)} MB` : "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{resource.download_count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {resource.category === "Docker镜像" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(resource.docker_pull_cmd || `docker pull ${resource.file_url}`)}
                          >
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            复制
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(resource)}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            下载
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={fetchResources} />}
    </div>
  );
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("软件");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [xhrRef, setXhrRef] = useState<XMLHttpRequest | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleCancel = () => {
    if (xhrRef) {
      xhrRef.abort();
      setXhrRef(null);
    }
    setUploading(false);
    setProgress(0);
    setProgressText("");
    setErrorMsg("");
  };

  const uploadWithProgress = (file: File): Promise<{ publicUrl: string; key: string; originalName: string; size: number; success: boolean }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      setXhrRef(xhr);
      xhr.open("POST", "/api/upload");
      xhr.timeout = 5 * 60 * 1000; // 5 分钟超时

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          setProgressText(`${formatSize(e.loaded)} / ${formatSize(e.total)}`);
        }
      };

      xhr.onload = () => {
        setXhrRef(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("解析响应失败"));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || "上传失败"));
          } catch {
            reject(new Error(`上传失败 (${xhr.status})`));
          }
        }
      };

      xhr.ontimeout = () => {
        setXhrRef(null);
        reject(new Error("上传超时，文件可能过大，请重试"));
      };

      xhr.onabort = () => {
        setXhrRef(null);
        reject(new Error("上传已取消"));
      };

      xhr.onerror = () => {
        setXhrRef(null);
        reject(new Error("网络错误，请检查网络连接后重试"));
      };

      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!file && category !== "Docker镜像") {
      setErrorMsg("请选择文件");
      return;
    }

    // 前端预检文件大小（500MB）
    if (file && file.size > 500 * 1024 * 1024) {
      setErrorMsg(`文件过大（${formatSize(file.size)}），最大支持 500MB`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setProgressText("");

    let fileUrl = "";
    let fileKey = null as string | null;
    if (file && category !== "Docker镜像") {
      try {
        setProgressText("准备上传...");
        const uploadData = await uploadWithProgress(file);
        fileUrl = uploadData.publicUrl || uploadData.key;
        fileKey = uploadData.key;
        setProgressText("保存资源信息...");
      } catch (err) {
        setUploading(false);
        setProgress(0);
        setProgressText("");
        const msg = err instanceof Error ? err.message : "上传失败";
        if (msg !== "上传已取消") {
          setErrorMsg(msg);
        }
        return;
      }
    } else {
      fileUrl = name;
    }

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        category,
        file_url: fileUrl,
        file_key: fileKey,
        file_size: file ? file.size : null,
        file_type: file?.type || "docker",
        docker_pull_cmd: category === "Docker镜像" ? `docker pull ${name}` : null,
      }),
    });

    setUploading(false);
    setProgress(0);
    setProgressText("");
    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      try {
        const errData = await res.json();
        setErrorMsg(errData.error || "保存失败");
      } catch {
        setErrorMsg("保存失败");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-float">
        <h2 className="mb-4 font-serif text-xl font-bold text-primary">上传资源</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">名称</label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMsg(""); }}
              placeholder="资源名称"
              required
              className="mt-1 bg-muted border-none rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">描述</label>
            <Input
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrorMsg(""); }}
              placeholder="简短描述"
              className="mt-1 bg-muted border-none rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md bg-muted px-3 py-2 text-sm outline-none"
            >
              {categories.slice(1).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {category !== "Docker镜像" && (
            <div>
              <label className="text-sm font-medium">文件</label>
              <Input
                type="file"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setErrorMsg(""); }}
                className="mt-1 bg-muted border-none rounded-md"
              />
              {file && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {file.name} ({formatSize(file.size)})
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground/60">支持最大 500MB 文件</p>
            </div>
          )}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progressText || "上传中..."}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {errorMsg && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            {uploading ? (
              <Button variant="outline" type="button" onClick={handleCancel} className="text-destructive hover:bg-destructive/10">
                取消上传
              </Button>
            ) : (
              <Button variant="outline" type="button" onClick={onClose}>
                取消
              </Button>
            )}
            <Button type="submit" disabled={uploading} className="bg-primary text-primary-foreground">
              {uploading ? `上传中 ${progress}%` : "确认上传"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
