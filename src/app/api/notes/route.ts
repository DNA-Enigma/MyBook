import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_TAGS = 10;
const ALLOWED_CATEGORIES = ["技术", "生活", "设计", "随笔"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const authorId = searchParams.get("author");
    const limit = searchParams.get("limit");

    // 获取当前用户（如有）
    const accessToken = request.cookies.get("sb-access-token")?.value;
    let currentUserId: string | null = null;
    if (accessToken) {
      const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
      currentUserId = userData.user?.id || null;
    }

    let query = getSupabaseAdmin()
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    // 未登录用户只能看公开笔记；登录用户看公开笔记+自己的笔记
    if (!currentUserId) {
      query = query.eq("is_public", true);
    } else {
      query = query.or(`is_public.eq.true,author_id.eq.${currentUserId}`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (search) {
      const safeSearch = search.replace(/[%_]/g, "\\$&").substring(0, 100);
      query = query.or(`title.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`);
    }
    if (authorId) {
      query = query.eq("author_id", authorId);
    }
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        query = query.limit(limitNum);
      }
    }

    const { data: notesData, error: notesError } = await query;
    if (notesError) throw notesError;

    let notes = notesData || [];

    // tag 筛选在内存中处理（避免 Supabase jsonb contains 在中文 tag 上的 500 错误）
    if (tag) {
      notes = notes.filter((n: { tags: unknown }) => Array.isArray(n.tags) && (n.tags as string[]).includes(tag));
    }
    const authorIds = [...new Set(notes.map((n: { author_id: string }) => n.author_id))];

    let authorsMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
    if (authorIds.length > 0) {
      const { data: profilesData } = await getSupabaseAdmin()
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", authorIds);
      authorsMap = (profilesData || []).reduce((acc, p) => {
        acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { name: string | null; avatar_url: string | null }>);
    }

    const enrichedNotes = notes.map((note: { author_id: string }) => ({
      ...note,
      author: authorsMap[note.author_id] || { name: "未知用户", avatar_url: null },
    }));

    return NextResponse.json({ notes: enrichedNotes });
  } catch (err) {
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

    // 速率限制
    const rateKey = `notes_create:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `创建过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 标题验证
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `标题长度不能超过${MAX_TITLE_LENGTH}字` },
        { status: 400 }
      );
    }

    // 内容长度验证
    const content = String(body.content || "");
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `内容长度不能超过${MAX_CONTENT_LENGTH}字` },
        { status: 400 }
      );
    }

    // 分类验证
    const category = body.category || "技术";
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "无效的分类" }, { status: 400 });
    }

    // 标签验证
    let tags = Array.isArray(body.tags) ? body.tags : [];
    tags = tags
      .map((t: string) => String(t).trim().substring(0, 30))
      .filter(Boolean)
      .slice(0, MAX_TAGS);

    const { data, error } = await getSupabaseAdmin()
      .from("notes")
      .insert({
        title,
        content,
        category,
        tags,
        is_public: body.is_public ?? true,
        author_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (err) {
    const message =
      (err as { message?: string })?.message ||
      (err as { error_description?: string })?.error_description ||
      (err as { msg?: string })?.msg ||
      String(err);
    return NextResponse.json(
      { error: message || "创建失败" },
      { status: 500 }
    );
  }
}
