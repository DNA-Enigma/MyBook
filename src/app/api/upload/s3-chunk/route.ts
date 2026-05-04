import { NextRequest, NextResponse } from "next/server";
import { uploadPart } from "@/lib/s3-storage";

// 接收单个分片，立即上传到 S3（不写 /tmp，零落盘）
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const cookie = request.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    if (!tokenMatch) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const chunk = formData.get("chunk") as File | null;
    const uploadId = formData.get("uploadId") as string | null;
    const s3Key = formData.get("s3Key") as string | null;
    const partNumberStr = formData.get("partNumber") as string | null;

    if (!chunk || !uploadId || !s3Key || !partNumberStr) {
      return NextResponse.json(
        { error: "缺少必要参数（chunk, uploadId, s3Key, partNumber）" },
        { status: 400 },
      );
    }

    const partNumber = parseInt(partNumberStr, 10);
    if (isNaN(partNumber) || partNumber < 1) {
      return NextResponse.json({ error: "partNumber 无效" }, { status: 400 });
    }

    // 读取分片数据
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 立即上传到 S3（不写 /tmp）
    const result = await uploadPart(s3Key, uploadId, partNumber, buffer);

    return NextResponse.json({
      success: true,
      partNumber: result.partNumber,
      eTag: result.eTag,
    });
  } catch (error) {
    console.error("[s3-chunk] Error:", error);
    return NextResponse.json(
      { error: "分片上传失败" },
      { status: 500 },
    );
  }
}
