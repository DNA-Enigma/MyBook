# 优化迭代计划

## 概述

基于已上线的个人综合服务门户，进行性能、安全、测试和 SEO 四个维度的深度优化。核心改动包括：首页服务端组件化、图片域名白名单收紧、测试用例覆盖、全站 SEO 元数据与错误边界补充。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 测试框架 | Vitest + React Testing Library + MSW | 轻量快速，与 Next.js 生态兼容好，支持 API Mock |
| 服务端数据获取 | Drizzle ORM 直连 + `unstable_cache` | 避免二次 HTTP 请求，提升首屏速度，支持 ISR |
| 图片限制 | `images.remotePatterns` 白名单 | 防止恶意图片外链、减少 CDN 被滥用风险 |
| SEO | Next.js `metadata` API + Open Graph | 原生支持，无需额外库，各页面独立配置 |

## 功能模块

### 1. 首页服务端组件化
- 移除 `"use client"` 和 `useEffect` 数据获取
- 使用 Drizzle ORM 在服务端直接查询 `notes` 表（`is_public = true LIMIT 3`）
- 使用 `unstable_cache` 缓存笔记列表（30 秒 revalidate）
- 模块卡片保持静态渲染，笔记列表部分用 `Suspense` 包裹

### 2. 图片域名收紧
- `next.config.ts`：`images.remotePatterns` 从 `hostname: '*'` 改为具体白名单：`images.unsplash.com`, `avatars.githubusercontent.com`, `*.supabase.co`
- CSP 头 `img-src` 同步收紧为相同白名单 + `self` + `data:`

### 3. 测试用例
- **API 测试**：注册/登录/笔记 CRUD/文件上传下载，覆盖成功和失败场景
- **安全测试**：密码弱校验、速率限制触发、未授权访问拒绝、路径遍历防护
- **组件测试**：Navbar 登录状态渲染、笔记卡片展示

### 4. SEO + 错误边界
- 为所有页面添加独立 `metadata`（title/description/openGraph）
- 添加 `robots.ts`（已存在，验证配置）
- 添加 `sitemap.ts` 自动生成站点地图
- 添加 `not-found.tsx` 和 `error.tsx` 全局错误边界

## 是否有原型设计

否。本次为纯代码优化迭代，无 UI 改动。

## 实施步骤

1. **首页服务端组件化 + 缓存策略** — 将 `src/app/page.tsx` 从客户端组件改为服务端组件，使用 Drizzle 直连查询，引入 `unstable_cache` 和 `Suspense`。
2. **收紧图片域名与 CSP** — 修改 `next.config.ts` 的 `images.remotePatterns` 为白名单，同步收紧 CSP 的 `img-src` 指令。
3. **搭建测试框架 + API 安全测试** — 安装 Vitest + MSW，编写认证、笔记、上传下载、安全防护的接口测试用例。
4. **组件单元测试** — 测试 Navbar 登录态渲染、笔记卡片展示等核心 UI 组件。
5. **全站 SEO 元数据 + 站点地图** — 为每个 page 添加 `metadata`，创建 `sitemap.ts` 和 `robots.ts`。
6. **错误边界页面** — 创建 `not-found.tsx` 和 `error.tsx`，提供友好的 404 和 500 页面。
7. **代码检查与验证** — 运行 `pnpm lint`、`pnpm ts-check` 和全量接口/单元测试，确保零回归。
