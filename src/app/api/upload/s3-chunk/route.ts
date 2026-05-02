import { NextRequest, NextResponse } from "next/server";

// 接收大文件的单个分片（≤10MB），写入 /tmp
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const uploadId = formData.get("uploadId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string, 10);
    const chunkFile = formData.get("chunk") as File;

    if (!uploadId || isNaN(chunkIndex) || !chunkFile) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 检查 session
    const fs = await import("fs/promises");
    const metaPath = `/tmp/s3-chunks/${uploadId}/meta.json`;
    try {
      await fs.access(metaPath);
    } catch {
      return NextResponse.json(
        { error: "上传会话不存在或已过期" },
        { status: 404 }
      );
    }

    // 写入分片文件
    const chunkData = Buffer.from(await chunkFile.arrayBuffer());
    await fs.writeFile(`/tmp/s3-chunks/${uploadId}/chunk_${chunkIndex}`, chunkData);
    await fs.writeFile(`/tmp/s3-chunks/${uploadId}/done_${chunkIndex}`, "1");

    return NextResponse.json({ success: true, chunkIndex });
  } catch (error) {
    console.error("[s3-chunk] Error:", error);
    return NextResponse.json(
      { error: "分片上传失败" },
      { status: 500 }
    );
  }
}
