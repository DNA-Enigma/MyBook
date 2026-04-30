import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split("@")[0] },
      },
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "注册失败" }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "注册失败" },
      { status: 500 }
    );
  }
}
