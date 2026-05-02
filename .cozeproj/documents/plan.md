# 大文件上传修复计划

## 概述

修复资源库大文件（>50MB）上传失败的问题。根因是 Supabase Storage 单文件大小限制（免费版 50MB），92MB 的文件在 chunk-complete 合并后调用 `uploadFile` 上传到 Supabase Storage 时被拒绝（"The object exceeded the maximum allowed size"）。需要将合并后的文件分段上传到 Supabase Storage（使用 Multipart Upload / TUS 协议），或改用分段上传后不合并直接存储分片。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 大文件上传策略 | Supabase Storage Multipart Upload | Supabase 支持 S3 兼容的分段上传 API，单段最大 5GB，总分段最多 10000，可突破 50MB 限制 |
| 分段大小 | 5MB/段 | Supabase Multipart Upload 要求每段 5MB~5GB，5MB 适配代理层限制 |
| 小文件兼容 | ≤50MB 继续用现有 uploadFile | 避免不必要的改动，小文件走现有流程 |
| 文件大小限制提示 | 前端提示最大支持文件大小 | 避免用户上传超限文件后才知道失败 |

## 根因分析

```
用户上传 92MB Steam.zip
  → chunk-init: 创建分片会话 ✅
  → chunk x10: 每片 10MB 上传到 /tmp ✅
  → chunk-complete: 合并所有分片为 92MB Buffer ✅
  → uploadFile(buffer) 上传到 Supabase Storage ❌ "The object exceeded the maximum allowed size"
```

**关键**：分片上传绕过了代理层 body size 限制，但最终合并后整个文件仍以单个对象上传到 Supabase Storage，受限于 Supabase 的单对象大小上限。

## 解决方案

使用 Supabase Storage 的 S3 兼容 Multipart Upload API：

1. **chunk-complete 不再合并所有分片为单个 Buffer**
2. 改为：
   - 调用 `createMultipartUpload` 初始化分段上传，获取 `uploadId`
   - 逐段读取分片文件，调用 `uploadPart` 上传每个分段到 Supabase Storage
   - 所有分段上传完成后，调用 `completeMultipartUpload` 合并
3. 每段 ≤50MB（实际用 5MB 更安全），绕过单对象大小限制

## 功能模块

### 1. Supabase Multipart Upload 工具函数（storage.ts）

新增函数：
- `createMultipartUpload(bucket, key, contentType)` → 返回 `{ uploadId, key }`
- `uploadPart(bucket, key, uploadId, partNumber, body)` → 返回 `{ ETag, partNumber }`
- `completeMultipartUpload(bucket, key, uploadId, parts)` → 返回 `{ key }`

### 2. chunk-complete 路由改造

改造逻辑：
- 读取 meta.json 获取文件信息
- 判断文件大小：≤50MB 走原流程（合并→uploadFile）；>50MB 走 Multipart Upload
- Multipart Upload 流程：
  1. `createMultipartUpload`
  2. 循环每个分片：读取 chunk_N 文件 → `uploadPart`（每段就是一个分片，但需要确保 ≥5MB，最后一段可以 <5MB）
  3. `completeMultipartUpload`
- 返回 publicUrl 和 key

### 3. 前端上传限制提示

- 前端已有"支持最大3GB文件"提示，保持不变（Supabase Pro 支持更大文件）

## 是否有原型设计

否 — 本次为后端逻辑修复，不涉及页面/UI 改动。

## 实施步骤

1. **在 storage.ts 中新增 Multipart Upload 工具函数** — `src/lib/storage.ts`
2. **改造 chunk-complete 路由，>50MB 文件走 Multipart Upload** — `src/app/api/upload/chunk-complete/route.ts`
3. **验证测试** — 静态检查 + 接口测试 + 日志检查
