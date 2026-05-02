import { getSupabaseAdmin } from "./supabase";

const BUCKET_NAME = process.env.COZE_BUCKET_NAME || "uploads";

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const { error } = await getSupabaseAdmin().storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return fileName;
}

export async function getPublicUrl(fileName: string): Promise<string> {
  const { data } = getSupabaseAdmin().storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function getSignedDownloadUrl(fileName: string, expiresIn = 300): Promise<string> {
  const { data, error } = await getSupabaseAdmin().storage
    .from(BUCKET_NAME)
    .createSignedUrl(fileName, expiresIn);

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
}

export function getBucketName(): string {
  return BUCKET_NAME;
}

export async function deleteFile(fileName: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage.from(BUCKET_NAME).remove([fileName]);
  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
