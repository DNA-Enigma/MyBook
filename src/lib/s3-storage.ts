import { S3Storage } from "coze-coding-dev-sdk";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

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

// ============ S3 PutObject 流式上传 ============
// 适用于代理不支持 Multipart Upload 的场景
// 将分片文件按序读取后通过流式 PutObject 上传到 S3

function getS3Client(): S3Client {
  const storage = initS3Storage();
  const client = (storage as unknown as { getClient: () => S3Client }).getClient();
  return client;
}

/**
 * 流式 PutObject 上传
 * 接收一个 Node.js Readable stream，通过 PutObject 一次性上传到 S3
 * 适用于从 /tmp 分片文件顺序读取后流式上传的场景
 */
export async function putObjectStream(
  key: string,
  body: Readable,
  contentLength: number,
  contentType: string,
): Promise<boolean> {
  const client = getS3Client();
  const bucket = getS3BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  // 设置较长超时（10GB 文件可能需要较长时间上传）
  // S3Client 已在 SDK 初始化时配置了连接参数
  await client.send(command);
  return true;
}
