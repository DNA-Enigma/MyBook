import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { db } from "@/lib/db";
import { comments, profiles } from "@/storage/database/shared/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { checkRateLimit } from "@/lib/security";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await db
      .select({
        id: comments.id,
        blog_id: comments.blog_id,
        parent_id: comments.parent_id,
        author_id: comments.author_id,
        author_name: comments.author_name,
        author_avatar: comments.author_avatar,
        content: comments.content,
        created_at: comments.created_at,
      })
      .from(comments)
      .where(eq(comments.blog_id, id))
      .orderBy(desc(comments.created_at));

    const formatted = rows.map((r) => ({
      ...r,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
    }));

    return NextResponse.json({ comments: formatted });
  } catch (err) {
    console.error("Comments GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const rateKey = `comment_create:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `评论过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "评论内容不能超过 2000 字" }, { status: 400 });
    }

    // 获取作者信息
    const profileRows = await db
      .select({ name: profiles.name, avatar_url: profiles.avatar_url })
      .from(profiles)
      .where(eq(profiles.id, userData.user.id))
      .limit(1);

    const authorName = profileRows[0]?.name || userData.user.email?.split("@")[0] || "匿名用户";
    const authorAvatar = profileRows[0]?.avatar_url || null;

    const result = await db
      .insert(comments)
      .values({
        blog_id: id,
        parent_id: parent_id || null,
        author_id: userData.user.id,
        author_name: authorName,
        author_avatar: authorAvatar,
        content: content.trim(),
      })
      .returning();

    return NextResponse.json({ comment: result[0] });
  } catch (err) {
    console.error("Comment POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "评论失败" },
      { status: 500 }
    );
  }
}
