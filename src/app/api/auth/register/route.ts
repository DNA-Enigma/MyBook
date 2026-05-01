import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validatePassword, validateEmail, checkRateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // 速率限制：每个 IP 每分钟最多 3 次注册尝试
    const clientIp = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateKey = `register:${clientIp}`;
    const rateCheck = checkRateLimit(rateKey, 3, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `请求过于频繁，请${rateCheck.retryAfter}秒后重试` },
        { status: 429 }
      );
    }

    const { email, password, name } = await request.json();

    // 输入验证
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 密码复杂度验证
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    // 名称长度限制
    const safeName = name ? String(name).trim().substring(0, 50) : email.split("@")[0];

    const { data, error } = await getSupabaseAdmin().auth.signUp({
      email,
      password,
      options: {
        data: { name: safeName },
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "注册失败" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "注册失败" },
      { status: 500 }
    );
  }
}
