import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 初始化分片上传会话
// 返回 sessionId，客户端用它来关联后续的分片上传
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("sb-access-token");
    if (!cookie?.value) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, contentType, totalChunks } = body;

    if (!fileName || !fileSize || !totalChunks) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 生成唯一 sessionId
    const sessionId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // 在 /tmp 下创建临时目录存放分片
    const fs = await import("fs/promises");
    const tmpDir = `/tmp/chunks/${sessionId}`;
    await fs.mkdir(tmpDir, { recursive: true });

    // 写入元信息
    const meta = { fileName, fileSize, contentType, totalChunks, sessionId };
    await fs.writeFile(`${tmpDir}/meta.json`, JSON.stringify(meta));

    return NextResponse.json({ sessionId, chunkSize: 10 * 1024 * 1024 }); // 10MB per chunk
  } catch (err) {
    console.error("[chunk-init] Error:", err);
    return NextResponse.json({ error: "初始化上传失败" }, { status: 500 });
  }
}
