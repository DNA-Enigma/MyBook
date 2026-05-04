import { S3Storage } from "coze-coding-dev-sdk";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

// S3 兼容对象存储客户端（用于大文件上传，无 50MB 限制）
// 使用懒加载避免构建时环境变量缺失导致报错

let _s3Storage: S3Storage | null = null;
let _s3BucketName: string = "";

function getS3Config() {
  const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL || "";
  const bucketName = process.env.COZE_BUCKET_NAME || "";
  if (!endpointUrl || !bucketName) {
    throw new Error("Missing S3 storage environment variables: COZE_BUCKET_ENDPOINT_URL, COZE_BUCKET_NAME");
  }
  return { endpointUrl, bucketName };
}

function initS3Storage() {
  if (_s3Storage) return _s3Storage;
  const { endpointUrl, bucketName } = getS3Config();
  _s3Storage = new S3Storage({
    endpointUrl,
    accessKey: "",
    secretKey: "",
    bucketName,
    region: "cn-beijing",
  });
  _s3BucketName = bucketName;
  return _s3Storage;
}

export const s3Storage = new Proxy({} as S3Storage, {
  get(_target, prop) {
    const storage = initS3Storage();
    const value = (storage as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(storage);
    }
    return value;
  },
});

export function getS3BucketName(): string {
  initS3Storage();
  return _s3BucketName;
}

export { getS3BucketName as s3BucketName };

// ============ S3 Multipart Upload 直传辅助 ============
// 让浏览器通过预签名 URL 直传分片到 S3，绕过 FaaS 请求体大小限制

function getS3Client(): S3Client {
  const storage = initS3Storage();
  const client = (storage as unknown as { getClient: () => S3Client }).getClient();
  return client;
}

/** 创建 Multipart Upload 会话 */
export async function createMultipartUpload(key: string, contentType: string) {
  const client = getS3Client();
  const bucket = getS3BucketName();
  const cmd = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const result = await client.send(cmd);
  if (!result.UploadId) {
    throw new Error("Failed to create multipart upload");
  }
  return { uploadId: result.UploadId, key };
}

/** 为指定分片生成预签名 PUT URL（浏览器直传） */
export async function presignUploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  contentLength: number,
) {
  const client = getS3Client();
  const bucket = getS3BucketName();
  const cmd = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    ContentLength: contentLength,
  });
  const url = await getSignedUrl(client as any, cmd as any, { expiresIn: 3600 }); // 1小时有效
  return url;
}

/** 完成Multipart Upload */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[],
) {
  const client = getS3Client();
  const bucket = getS3BucketName();
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
  const cmd = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: sortedParts },
  });
  const result = await client.send(cmd);
  return result;
}

/** 服务端直传：将分片数据直接上传到 S3（不落盘） */
export async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer | Uint8Array,
) {
  const client = getS3Client();
  const bucket = getS3BucketName();
  const cmd = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  });
  const result = await client.send(cmd);
  if (!result.ETag) {
    throw new Error(`UploadPart failed for part ${partNumber}`);
  }
  return { partNumber, eTag: result.ETag };
}

/** 中止Multipart Upload（出错时清理） */
export async function abortMultipartUpload(key: string, uploadId: string) {
  try {
    const client = getS3Client();
    const bucket = getS3BucketName();
    const cmd = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });
    await client.send(cmd);
  } catch {
    // 清理失败不影响主流程
  }
}
