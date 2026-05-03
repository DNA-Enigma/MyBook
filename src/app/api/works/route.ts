import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security";
import { db } from "@/lib/db";
import { works, profiles } from "@/storage/database/shared/schema";
import { eq, desc, and } from "drizzle-orm";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10000;
const ALLOWED_CATEGORIES = ["设计", "开发", "摄影", "写作", "项目", "其他"];
const ALLOWED_WORK_TYPES = ["project", "website", "photography", "design"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const authorId = searchParams.get("author");

    let query = db
      .select({
        id: works.id,
        title: works.title,
        description: works.description,
        cover_image_url: works.cover_image_url,
        images: works.images,
        category: works.category,
        work_type: works.work_type,
        tech_stack: works.tech_stack,
        external_link: works.external_link,
        is_public: works.is_public,
        created_at: works.created_at,
        author_id: works.author_id,
        author_name: profiles.name,
        author_avatar: profiles.avatar_url,
      })
      .from(works)
      .leftJoin(profiles, eq(works.author_id, profiles.id))
      .orderBy(desc(works.created_at));

    const conditions = [];
    if (category && category !== "all") conditions.push(eq(works.category, category));
    if (authorId) conditions.push(eq(works.author_id, authorId));

    const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

    const formatted = rows.map((r) => ({
      ...r,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      author: r.author_id ? { name: r.author_name, avatar_url: r.author_avatar } : null,
    }));

    return NextResponse.json({ works: formatted });
  } catch (err) {
    console.error("Works GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败", detail: String(err) },
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
    const rateKey = `works_create:${userData.user.id}`;
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

    // 描述长度验证
    const description = String(body.description || "");
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `描述长度不能超过${MAX_DESCRIPTION_LENGTH}字` },
        { status: 400 }
      );
    }

    // 分类验证
    const category = body.category || "开发";
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "无效的分类" }, { status: 400 });
    }

    // 作品类型验证
    const workType = body.work_type || "project";

    // 图片列表
    const images = Array.isArray(body.images) ? body.images : [];
    // 封面图取第一张
    const coverImageUrl = body.cover_image_url || (images.length > 0 ? images[0].url || images[0] : null);

    const { data, error } = await getSupabaseAdmin()
      .from("works")
      .insert({
        title,
        description,
        cover_image_url: coverImageUrl,
        images,
        category,
        work_type: workType,
        tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
        external_link: body.external_link || null,
        is_public: body.is_public ?? true,
        author_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ work: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建失败" },
      { status: 500 }
    );
  }
}
