/**
 * 安全工具函数
 * 包含密码验证、速率限制、文件安全检查等
 */

// 密码复杂度验证
export function validatePassword(password: string): {
  valid: boolean;
  message: string;
} {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push("至少8位");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("包含小写字母");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("包含大写字母");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("包含数字");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("包含特殊字符");
  }

  // 检查常见弱密码（子串匹配，更严格）
  const weakPattern = /(?:123456|password|qwerty|letmein|iloveyou|admin|welcome|monkey|login|abc123|111111|123123|baseball|football|12345678|123456789|1234567|1234|qwertyuiop)/i;
  if (weakPattern.test(password)) {
    errors.push("不能是常见弱密码");
  }

  if (errors.length > 0) {
    return { valid: false, message: `密码不符合要求：${errors.join("、")}` };
  }

  return { valid: true, message: "密码符合要求" };
}

// 内存中的速率限制器（生产环境应使用 Redis）
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// 文件上传安全检查
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/markdown",
  ],
  software: [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-gzip",
  ],
};

const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".md",
  ".zip", ".tar", ".gz", ".tgz",
  ".dockerfile", ".yml", ".yaml", ".json",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateUploadFile(file: File): {
  valid: boolean;
  message: string;
} {
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: `文件大小超过限制（最大${MAX_FILE_SIZE / 1024 / 1024}MB）` };
  }

  // 检查文件类型
  const allAllowedTypes = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!allAllowedTypes.includes(file.type)) {
    // 检查扩展名作为备选
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, message: "不支持的文件类型" };
    }
  }

  // 检查文件名安全性（防止路径遍历）
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (safeName !== file.name && /[\x00-\x1f\/\\:<>'"|?*]/.test(file.name)) {
    return { valid: false, message: "文件名包含非法字符" };
  }

  return { valid: true, message: "文件检查通过" };
}

// 生成安全的文件名
export function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = originalName.includes(".")
    ? originalName.substring(originalName.lastIndexOf("."))
    : "";
  const safeBase = originalName
    .substring(0, originalName.lastIndexOf(".") > 0 ? originalName.lastIndexOf(".") : originalName.length)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 50);
  return `${timestamp}-${randomStr}-${safeBase}${ext}`;
}

// XSS 输入清理
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// 验证邮箱格式
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
