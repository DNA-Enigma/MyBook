import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/security";

const MAX_IMPORT_COUNT = 50;
const ALLOWED_CATEGORIES = ["技术", "生活", "设计", "随笔"];
const MAX_TAGS = 10;

function parseMarkdown(md: string) {
  const frontmatterMatch = md.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!frontmatterMatch) {
    // 没有 frontmatter，全部作为内容
    return { title: "未命名笔记", category: "随笔", tags: [], content: md.trim() };
  }

  const fm = frontmatterMatch[1];
  const content = frontmatterMatch[2].trim();

  const titleMatch = fm.match(/^title:\s*"?([^"\n]+)"?$/m);
  const categoryMatch = fm.match(/^category:\s*(.+)$/m);
  const tagsMatch = fm.match(/^tags:\s*\[(.*?)\]$/m);

  const title = titleMatch ? titleMatch[1].trim() : "未命名笔记";
  const category = categoryMatch ? categoryMatch[1].trim() : "随笔";
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/^"|"$/g, ""))
        .filter(Boolean)
    : [];

  return { title, category, tags, content };
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 速率限制
    const rateKey = `notes_import:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `导入过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const items = Array.isArray(body.notes) ? body.notes : [body];

      if (items.length > MAX_IMPORT_COUNT) {
        return NextResponse.json(
          { error: `一次最多导入${MAX_IMPORT_COUNT}篇笔记` },
          { status: 400 }
        );
      }

      const toInsert = items.map((item: Record<string, unknown>) => {
        const title = String(item.title || "未命名笔记").trim().substring(0, 200);
        const category = ALLOWED_CATEGORIES.includes(String(item.category))
          ? String(item.category)
          : "随笔";
        const tags = (Array.isArray(item.tags) ? item.tags : [])
          .map((t: string) => String(t).trim().substring(0, 30))
          .filter(Boolean)
          .slice(0, MAX_TAGS);
        const content = String(item.content || "").substring(0, 50000);

        return {
          title,
          content,
          category,
          tags,
          is_public: item.is_public !== false,
          author_id: userData.user.id,
        };
      });

      const { data, error } = await supabaseAdmin.from("notes").insert(toInsert).select();
      if (error) throw error;

      return NextResponse.json({ imported: data?.length || 0, notes: data });
    }

    // Markdown 导入
    if (contentType.includes("text/markdown") || contentType.includes("text/plain")) {
      const md = await request.text();
      const parsed = parseMarkdown(md);
      const category = ALLOWED_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "随笔";
      const tags = parsed.tags.slice(0, MAX_TAGS);

      const { data, error } = await supabaseAdmin
        .from("notes")
        .insert({
          title: parsed.title.substring(0, 200),
          content: parsed.content.substring(0, 50000),
          category,
          tags,
          is_public: true,
          author_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ imported: 1, note: data });
    }

    return NextResponse.json({ error: "不支持的格式" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "导入失败" },
      { status: 500 }
    );
  }
}
