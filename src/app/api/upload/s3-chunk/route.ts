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
    const accessToken = request.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { supabaseAnon } = await import("@/lib/supabase");
    const { data: { user } } = await supabaseAnon.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 从 FormData body 中读取参数（前端用 FormData 发送 chunk + uploadId + partIndex）
    const formData = await request.formData();
    const uploadId = formData.get("uploadId") as string | null;
    const partIndex = formData.get("partIndex") as string | null;
    const chunkBlob = formData.get("chunk") as Blob | null;

    if (!uploadId || !partIndex) {
      return NextResponse.json({ error: "缺少 uploadId 或 partIndex" }, { status: 400 });
    }

    if (!chunkBlob) {
      return NextResponse.json({ error: "缺少分片数据" }, { status: 400 });
    }

    const tmpDir = `/tmp/upload_${uploadId}`;
    if (!fs.existsSync(tmpDir)) {
      return NextResponse.json({ error: "上传会话不存在，请重新初始化" }, { status: 400 });
    }

    // 将分片数据写入本地文件
    const chunkPath = `${tmpDir}/part_${partIndex}`;
    const buffer = Buffer.from(await chunkBlob.arrayBuffer());
    fs.writeFileSync(chunkPath, buffer);

    return NextResponse.json({
      success: true,
      partNumber: parseInt(partIndex, 10),
      size: buffer.length,
    });
  } catch (error) {
    console.error("[s3-chunk] Error:", error);
    return NextResponse.json({ error: "分片上传失败" }, { status: 500 });
  }
}
