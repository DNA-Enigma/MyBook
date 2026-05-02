import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 初始化分片上传会话
// 返回 uploadId，客户端用它来关联后续的分片上传
export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 验证用户身份，获取 userId
    const { data: userData } = await getSupabaseAdmin().auth.getUser(accessToken);
    if (!userData.user) {
      return NextResponse.json({ error: "未登录或登录已过期" }, { status: 401 });
    }
    const userId = userData.user.id;

    const body = await request.json();
    const { fileName, fileSize, contentType, totalChunks } = body;

    if (!fileName || !fileSize || !totalChunks) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 生成唯一 uploadId
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // 在 /tmp 下创建临时目录存放分片
    const fs = await import("fs/promises");
    const tmpDir = `/tmp/chunks/${uploadId}`;
    await fs.mkdir(tmpDir, { recursive: true });

    // 写入元信息（包含 userId，供 chunk-complete 使用）
    const meta = { fileName, fileSize, contentType, totalChunks, uploadId, userId };
    await fs.writeFile(`${tmpDir}/meta.json`, JSON.stringify(meta));

    return NextResponse.json({ uploadId, chunkSize: 10 * 1024 * 1024 }); // 10MB per chunk
  } catch (err) {
    console.error("[chunk-init] Error:", err);
    return NextResponse.json({ error: "初始化上传失败" }, { status: 500 });
  }
}
