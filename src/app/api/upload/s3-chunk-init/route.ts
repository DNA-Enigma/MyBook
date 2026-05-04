import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import fs from "fs";

export const maxDuration = 600;

/**
 * 初始化分片上传
 * 只创建本地 uploadId 和目录，不调用 S3 Multipart API
 * 因为 Coze S3 代理不支持 Multipart Upload
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

    const body = await request.json();
    const { fileName, fileSize, contentType } = body as {
      fileName: string;
      fileSize: number;
      contentType: string;
    };

    if (!fileName || !fileSize || !contentType) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 检查 /tmp 可用空间
    let availableSpace = 0;
    try {
      const dfOutput = execSync("df -B1 /tmp").toString();
      const lines = dfOutput.trim().split("\n");
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        availableSpace = parseInt(parts[3], 10);
      }
    } catch {
      // 无法检测空间，允许继续（假设空间足够）
      availableSpace = 11 * 1024 * 1024 * 1024; // 假设 11GB
    }

    // 预留 500MB 给系统
    const requiredSpace = fileSize + 500 * 1024 * 1024;
    if (availableSpace > 0 && availableSpace < requiredSpace) {
      const availableGB = (availableSpace / (1024 * 1024 * 1024)).toFixed(1);
      return NextResponse.json({
        error: `服务器临时空间不足，当前可用 ${availableGB}GB，需要 ${(fileSize / (1024 * 1024 * 1024)).toFixed(1)}GB`,
      }, { status: 400 });
    }

    const uploadId = randomUUID();
    const s3Key = `uploads/${Date.now()}_${fileName}`;

    // 创建临时目录
    const tmpDir = `/tmp/upload_${uploadId}`;
    fs.mkdirSync(tmpDir, { recursive: true });

    // 写入元数据文件
    fs.writeFileSync(`${tmpDir}/meta.json`, JSON.stringify({
      fileName,
      fileSize,
      contentType,
      s3Key,
      createdAt: Date.now(),
    }));

    return NextResponse.json({
      uploadId,
      s3Key,
    });
  } catch (error) {
    console.error("[s3-chunk-init] Error:", error);
    return NextResponse.json({ error: "初始化上传失败" }, { status: 500 });
  }
}
