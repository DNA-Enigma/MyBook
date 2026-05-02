import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("filePath");
  if (!filePath) {
    return NextResponse.json({ error: "缺少 filePath 参数" }, { status: 400 });
  }

  const bucketName = process.env.COZE_BUCKET_NAME || "uploads";

  try {
    const { data } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl: data.publicUrl });
  } catch {
    return NextResponse.json({ error: "获取公开URL失败" }, { status: 500 });
  }
}
