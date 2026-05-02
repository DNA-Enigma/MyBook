import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getBucketName } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 大文件拼装上传需要时间

// 所有分片上传完成后，合并分片并上传到 Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get("sb-access-token");
    if (!cookie?.value) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
    }

    const fs = await import("fs/promises");
    const tmpDir = `/tmp/chunks/${sessionId}`;

    // 读取元信息
    let meta: {
      fileName: string;
      fileSize: number;
      contentType: string;
      totalChunks: number;
      sessionId: string;
      userId: string;
    };
    try {
      const metaRaw = await fs.readFile(`${tmpDir}/meta.json`, "utf-8");
      meta = JSON.parse(metaRaw);
    } catch {
      return NextResponse.json({ error: "上传会话不存在或已过期" }, { status: 400 });
    }

    // 验证所有分片已上传
    for (let i = 0; i < meta.totalChunks; i++) {
      try {
        await fs.access(`${tmpDir}/done_${i}`);
      } catch {
        return NextResponse.json(
          { error: `分片 ${i + 1}/${meta.totalChunks} 尚未上传` },
          { status: 400 }
        );
      }
    }

    // 合并所有分片到 Buffer
    const chunks: Buffer[] = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkBuffer = await fs.readFile(`${tmpDir}/chunk_${i}`);
      chunks.push(chunkBuffer);
    }
    const fileBuffer = Buffer.concat(chunks, meta.fileSize);

    // 构建 Supabase Storage 文件路径
    const bucketName = getBucketName();
    const ext = meta.fileName.includes(".") ? meta.fileName.split(".").pop() : "";
    const uniqueName = ext
      ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filePath = `uploads/${meta.userId}/${uniqueName}`;

    // 上传到 Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: meta.contentType || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[chunk-complete] Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: `存储上传失败: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || "";

    // 清理临时文件
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filePath,
      fileName: meta.fileName,
      fileSize: meta.fileSize,
    });
  } catch (err) {
    console.error("[chunk-complete] Error:", err);
    return NextResponse.json({ error: "文件拼装失败" }, { status: 500 });
  }
}
