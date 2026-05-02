import { S3Storage } from "coze-coding-dev-sdk";

// S3 兼容对象存储客户端（用于大文件上传，无 50MB 限制）
const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL || "";
const bucketName = process.env.COZE_BUCKET_NAME || "";

if (!endpointUrl || !bucketName) {
  throw new Error("Missing S3 storage environment variables: COZE_BUCKET_ENDPOINT_URL, COZE_BUCKET_NAME");
}

export const s3Storage = new S3Storage({
  endpointUrl,
  accessKey: "",
  secretKey: "",
  bucketName,
  region: "cn-beijing",
});

export { bucketName as s3BucketName };
