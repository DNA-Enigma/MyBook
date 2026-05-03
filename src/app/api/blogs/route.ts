import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { db } from "@/lib/db";
import { blogs, profiles } from "@/storage/database/shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const authorId = searchParams.get("author_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);
    const offset = (page - 1) * pageSize;

    const conditions = [eq(blogs.is_public, true)];
    if (category && category !== "all") {
      conditions.push(eq(blogs.category, category));
    }
    if (authorId) {
      conditions.push(eq(blogs.author_id, authorId));
    }

    const query = db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        summary: blogs.summary,
        cover_image_url: blogs.cover_image_url,
        category: blogs.category,
        tags: blogs.tags,
        author_id: blogs.author_id,
        view_count: blogs.view_count,
        like_count: blogs.like_count,
        created_at: blogs.created_at,
        author_name: profiles.name,
        author_avatar: profiles.avatar_url,
      })
      .from(blogs)
      .leftJoin(profiles, eq(blogs.author_id, profiles.id))
      .where(and(...conditions))
      .orderBy(desc(blogs.created_at))
      .limit(pageSize)
      .offset(offset);

    const rows = await query;

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogs)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    const formatted = rows.map((r) => ({
      ...r,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      author: r.author_id
        ? { name: r.author_name, avatar_url: r.author_avatar }
        : null,
    }));

    return NextResponse.json({ blogs: formatted, total, page, pageSize });
  } catch (err) {
    console.error("Blogs GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const rateKey = `blogs_create:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `发布过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, summary, content, cover_image_url, category, tags, is_public } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 100);

    const result = await db
      .insert(blogs)
      .values({
        title: title.slice(0, 255),
        slug,
        summary: summary || content.replace(/[#*`\n]/g, "").slice(0, 200),
        content,
        cover_image_url,
        category: category || "技术分享",
        tags: Array.isArray(tags) ? tags : [],
        author_id: userData.user.id,
        is_public: is_public !== false,
      })
      .returning();

    return NextResponse.json({ blog: result[0] });
  } catch (err) {
    console.error("Blogs POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建失败" },
      { status: 500 }
    );
  }
}
