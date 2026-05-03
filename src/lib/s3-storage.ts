import { S3Storage } from "coze-coding-dev-sdk";

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
