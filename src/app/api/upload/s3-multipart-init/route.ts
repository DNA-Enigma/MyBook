import { NextRequest, NextResponse } from "next/server";
import {
  createMultipartUpload,
  abortMultipartUpload,
} from "@/lib/s3-storage";

// 大文件 S3 Multipart 直传初始化
// 返回 uploadId + key，后续浏览器通过预签名 URL 直传分片
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    // 验证用户
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data: { user } } = await supabaseAdmin.auth.getUser(tokenMatch[1]);
    if (!user) {
      return NextResponse.json({ error: "无效的登录凭证" }, { status: 401 });
    }

    // 生成 S3 对象键
    const key = `resources/${Date.now()}-${fileName}`;
    const result = await createMultipartUpload(key, contentType || "application/octet-stream");

    return NextResponse.json({
      uploadId: result.uploadId,
      key: result.key,
    });
  } catch (error) {
    console.error("[s3-multipart-init] Error:", error);
    return NextResponse.json(
      { error: "初始化上传失败" },
      { status: 500 }
    );
  }
}
