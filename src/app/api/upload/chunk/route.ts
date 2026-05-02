import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 上传单个分片
// 每个分片最大 10MB，不会触发代理 body size 限制
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("sb-access-token");
    if (!cookie?.value) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const sessionId = (formData.get("sessionId") || formData.get("uploadId")) as string;
    const chunkIndex = formData.get("chunkIndex") as string;
    const chunk = formData.get("chunk") as File;

    if (!sessionId || chunkIndex === null || !chunk) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const fs = await import("fs/promises");
    const tmpDir = `/tmp/chunks/${sessionId}`;

    // 检查会话是否存在
    try {
      await fs.access(`${tmpDir}/meta.json`);
    } catch {
      return NextResponse.json({ error: "上传会话不存在或已过期" }, { status: 400 });
    }

    // 将分片写入临时文件
    const buffer = Buffer.from(await chunk.arrayBuffer());
    await fs.writeFile(`${tmpDir}/chunk_${chunkIndex}`, buffer);

    // 记录已完成的分片
    await fs.writeFile(`${tmpDir}/done_${chunkIndex}`, "1");

    return NextResponse.json({ success: true, chunkIndex: parseInt(chunkIndex) });
  } catch (err) {
    console.error("[chunk] Error:", err);
    return NextResponse.json({ error: "分片上传失败" }, { status: 500 });
  }
}
