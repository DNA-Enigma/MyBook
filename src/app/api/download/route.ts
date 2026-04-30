import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSignedDownloadUrl } from "@/lib/storage";
import { checkRateLimit } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    // 下载需要登录验证
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录，请先登录后下载" }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin.auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "缺少文件 key" }, { status: 400 });
    }

    // 防止路径遍历攻击
    if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
      return NextResponse.json({ error: "非法的文件路径" }, { status: 400 });
    }

    // 速率限制：每个用户每分钟最多 20 次下载请求
    const rateKey = `download:${userData.user.id}`;
    const rateCheck = checkRateLimit(rateKey, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `下载过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const url = await getSignedDownloadUrl(key, 300);

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成下载链接失败" },
      { status: 500 }
    );
  }
}
