import { NextRequest, NextResponse } from "next/server";

// 大文件 S3 分片上传初始化
// 前端将大文件切成 ≤10MB 分片上传到服务端，服务端暂存 /tmp
// 收齐后用 S3 chunkUploadFile 上传到对象存储
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, contentType, totalChunks } = body;

    if (!fileName || !fileSize || !totalChunks) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const uploadId = `s3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 将上传会话信息存到 /tmp
    const fs = await import("fs/promises");
    const tmpDir = `/tmp/s3-chunks/${uploadId}`;
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(
      `${tmpDir}/meta.json`,
      JSON.stringify({
        fileName,
        fileSize,
        contentType: contentType || "application/octet-stream",
        totalChunks,
        uploadId,
      })
    );

    return NextResponse.json({
      uploadId,
      totalChunks,
    });
  } catch (error) {
    console.error("[s3-chunk-init] Error:", error);
    return NextResponse.json(
      { error: "初始化上传失败" },
      { status: 500 }
    );
  }
}
