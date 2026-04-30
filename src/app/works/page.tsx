"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ExternalLink } from "lucide-react";

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

const categories = ["全部", "设计", "开发", "摄影", "写作"];

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "全部") params.append("category", activeCategory);
    const res = await fetch(`/api/works?${params.toString()}`);
    const data = await res.json();
    setWorks(data.works || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorks();
  }, [activeCategory]);

  const filteredWorks = works.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-primary">作品</h1>
          <p className="mt-2 text-muted-foreground">展示设计、开发与创意项目</p>
        </div>
        {isAdmin && (
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link href="/works/edit">
              <Plus className="mr-1.5 h-4 w-4" />
              新建作品
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
            placeholder="搜索作品..."
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
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="rounded-xl bg-card py-20 text-center shadow-card">
          <p className="text-muted-foreground">暂无作品</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorks.map((work) => (
            <Link
              key={work.id}
              href={`/works/${work.id}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all hover:shadow-float"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={work.cover_image_url || "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=600&h=400&fit=crop"}
                  alt={work.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {work.category}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-primary group-hover:underline">
                  {work.title}
                </h3>
                <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {work.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {work.tech_stack?.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
