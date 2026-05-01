import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security";

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const ALLOWED_CATEGORIES = ["软件", "文档", "图片媒体", "Docker镜像"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = getSupabaseAdmin()
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ resources: data || [] });
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

    // 管理员权限校验
    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "无权限，仅管理员可操作" }, { status: 403 });
    }

    // 速率限制
    const rateKey = `resources_create:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `创建过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 名称验证
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `名称长度不能超过${MAX_NAME_LENGTH}字` },
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
    const category = body.category || "文档";
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "无效的分类" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("resources")
      .insert({
        name,
        description,
        file_url: body.file_url || null,
        file_key: body.file_key || null,
        file_type: body.file_type || null,
        file_size: body.file_size || null,
        category,
        docker_pull_cmd: body.docker_pull_cmd || null,
        is_public: body.is_public ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ resource: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建失败" },
      { status: 500 }
    );
  }
}
