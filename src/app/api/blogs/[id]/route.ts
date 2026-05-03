import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { db } from "@/lib/db";
import { blogs, profiles } from "@/storage/database/shared/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await db
      .select({
        id: blogs.id,
        title: blogs.title,
        slug: blogs.slug,
        summary: blogs.summary,
        content: blogs.content,
        cover_image_url: blogs.cover_image_url,
        category: blogs.category,
        tags: blogs.tags,
        author_id: blogs.author_id,
        view_count: blogs.view_count,
        like_count: blogs.like_count,
        is_public: blogs.is_public,
        created_at: blogs.created_at,
        updated_at: blogs.updated_at,
        author_name: profiles.name,
        author_avatar: profiles.avatar_url,
        author_bio: profiles.bio,
      })
      .from(blogs)
      .leftJoin(profiles, eq(blogs.author_id, profiles.id))
      .where(eq(blogs.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "博客不存在" }, { status: 404 });
    }

    const blog = rows[0];

    // 增加浏览量（异步，不阻塞响应）
    db.update(blogs)
      .set({ view_count: sql`${blogs.view_count} + 1` })
      .where(eq(blogs.id, id))
      .execute()
      .catch(() => {});

    return NextResponse.json({
      blog: {
        ...blog,
        created_at: blog.created_at ? new Date(blog.created_at).toISOString() : null,
        updated_at: blog.updated_at ? new Date(blog.updated_at).toISOString() : null,
        author: blog.author_id
          ? {
              name: blog.author_name,
              avatar_url: blog.author_avatar,
              bio: blog.author_bio,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Blog detail GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    // 检查权限
    const existing = await db
      .select({ author_id: blogs.author_id })
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "博客不存在" }, { status: 404 });
    }

    const isAdmin = userData.user.app_metadata?.role === "admin";
    if (existing[0].author_id !== userData.user.id && !isAdmin) {
      return NextResponse.json({ error: "无权修改" }, { status: 403 });
    }

    const body = await request.json();
    const { title, summary, content, cover_image_url, category, tags, is_public } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (is_public !== undefined) updateData.is_public = is_public;

    const result = await db.update(blogs).set(updateData).where(eq(blogs.id, id)).returning();

    return NextResponse.json({ blog: result[0] });
  } catch (err) {
    console.error("Blog PUT error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "更新失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db
      .select({ author_id: blogs.author_id })
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "博客不存在" }, { status: 404 });
    }

    const isAdmin = userData.user.app_metadata?.role === "admin";
    if (existing[0].author_id !== userData.user.id && !isAdmin) {
      return NextResponse.json({ error: "无权删除" }, { status: 403 });
    }

    await db.delete(blogs).where(eq(blogs.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Blog DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "删除失败" },
      { status: 500 }
    );
  }
}
