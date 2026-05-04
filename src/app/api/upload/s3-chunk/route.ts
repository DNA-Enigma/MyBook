import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

export const maxDuration = 600;

/**
 * 接收一个分片并存储到 /tmp
 * 不调用 S3 API，只在本地暂存
 */
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const { supabaseAnon } = await import("@/lib/supabase");
    const { data: { user } } = await supabaseAnon.auth.getUser(
      cookie.split(";").find((c) => c.trim().startsWith("access_token="))?.split("=")[1] || ""
    );
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const uploadId = request.nextUrl.searchParams.get("uploadId");
    const partNumber = request.nextUrl.searchParams.get("partNumber");

    if (!uploadId || !partNumber) {
      return NextResponse.json({ error: "缺少 uploadId 或 partNumber" }, { status: 400 });
    }

    const tmpDir = `/tmp/upload_${uploadId}`;
    if (!fs.existsSync(tmpDir)) {
      return NextResponse.json({ error: "上传会话不存在，请重新初始化" }, { status: 400 });
    }

    // 将分片数据写入本地文件
    const chunkPath = `${tmpDir}/part_${partNumber}`;
    const buffer = Buffer.from(await request.arrayBuffer());
    fs.writeFileSync(chunkPath, buffer);

    return NextResponse.json({
      success: true,
      partNumber: parseInt(partNumber, 10),
      size: buffer.length,
    });
  } catch (error) {
    console.error("[s3-chunk] Error:", error);
    return NextResponse.json({ error: "分片上传失败" }, { status: 500 });
  }
}
