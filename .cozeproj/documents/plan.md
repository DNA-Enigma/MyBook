# 个人主页改版 + 博客模块 + 图片加载修复计划

## 概述

修复三个核心问题并新增博客模块：1) 图片（头像/作品封面）无法加载；2) 个人主页无法编辑资料/上传头像，布局需改版（方形头像、笔记作品左右分栏+自动滚动）；3) 资源库下载功能不可用。同时新增独立博客板块（参考博客园，支持分享/提问/讨论），与笔记模块分离。平台：web。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 个人主页架构 | Server Component + Client Component 混合 | 资料展示用 Server，编辑交互用 Client |
| 头像上传 | Supabase Storage 标准上传 + 方形裁剪预览 | 已有 storage 基础设施，正方形避免证件照裁切问题 |
| 笔记/作品滚动 | CSS animation + Tailwind | 无需额外依赖，纯 CSS 实现无限滚动 |
| 图片域名 | 添加 Supabase Storage 域名到 next.config images | 图片来自 Supabase，需配置域名白名单 + 加载失败 fallback |
| 博客模块 | 新建 `blogs` + `comments` 表 | 与笔记完全独立，支持公开发布和社区讨论 |
| 下载修复 | 检查 file_key/file_url 字段映射 + S3/Supabase 签名 URL | 下载逻辑存在但可能 key 传值错误或 storage_type 判断错误 |

## 功能模块

### 1. 图片加载修复（头像 + 作品封面）

**问题**：`next/image` 使用了外部 Supabase Storage URL，未在 `next.config` 的 `images.remotePatterns` 中完整配置域名。同时数据库中 `avatar_url` 和 `cover_image_url` 可能为空。

**方案**：
- 在 `next.config.ts` 中添加 Supabase Storage 域名白名单
- 所有图片组件添加 `onError` fallback：加载失败时显示首字母占位或默认图标
- 头像上传后正确保存 `avatar_url` 到 `profiles` 表
- 作品封面上传后正确保存 `cover_image_url` 到 `works` 表

### 2. 个人主页改版（`/blog/[id]`）

**问题**：当前页面是纯 Server Component，只展示头像首字母和笔记列表，无法编辑，布局也不合理。

**改版设计**：

**布局结构**：
```
┌─────────────────────────────────────────┐
│ ← 返回    个人主页                      │
├─────────────────────────────────────────┤
│  ┌──────┐  用户名                       │
│  │ 方形  │  简介...                     │
│  │ 头像  │  联系方式 | 社交链接           │
│  └──────┘  [编辑资料] (仅本人可见)       │
├──────────────────┬──────────────────────┤
│   📝 公开笔记     │   🎨 公开作品        │
│  ┌──────────┐   │  ┌──────────────┐   │
│  │ 笔记卡片1 │   │  │ 作品卡片1     │   │
│  │ 笔记卡片2 │   │  │ 作品卡片2     │   │
│  │ 笔记卡片3 │   │  │ 作品卡片3     │   │
│  │ ↕ 自动滚动│   │  │ ↕ 自动滚动    │   │
│  └──────────┘   │  └──────────────┘   │
└──────────────────┴──────────────────────┘
```

**头像**：方形（`rounded-lg`），非圆形，避免证件照展示不全或显得丑。
**编辑功能**：仅当访问者是自己时显示"编辑资料"按钮，点击弹出编辑面板。
**自动滚动**：笔记和作品列表使用 CSS animation 实现无缝循环滚动，hover 时暂停。

**编辑面板包含**：
- 头像上传（正方形预览，支持选择文件后预览）
- 姓名、简介、联系邮箱
- GitHub / 个人网站 / LinkedIn 链接
- 保存按钮（调用 `/api/profile` PUT 更新）

### 3. 博客模块（独立板块）

**架构**：博客与笔记完全独立。笔记是个人知识管理（默认私有），博客是公开发布的分享/讨论区（参考博客园）。

**数据库**：

```sql
-- blogs 表
id uuid primary key
title text not null
content text not null
category text
tags text[]
author_id uuid references auth.users(id)
created_at timestamp
cover_image_url text
view_count int default 0

-- comments 表
id uuid primary key
blog_id uuid references blogs(id)
author_id uuid references auth.users(id)
content text not null
parent_id uuid references comments(id) -- 支持楼中楼
created_at timestamp
```

**页面**：
- `/blogs` — 博客列表页（分类筛选、标签云、文章卡片列表）
- `/blog-detail?id=xxx` — 博客详情页（正文 + 评论区，支持楼中楼回复）

### 4. 关于站长页面头像修复

同问题 1，确保 `next/image` 域名配置正确，头像加载失败 fallback 到首字母占位。

### 5. 资源库下载修复

**问题**：下载按钮点击后无反应或报错。

**方案**：
- 检查数据库中资源的 `file_key` / `file_url` / `storage_type` 字段实际值
- 确保 S3 上传时正确写入 `file_key` 和 `storage_type = "s3"`
- 下载时根据 `storage_type` 正确路由到 S3 或 Supabase 逻辑
- 添加错误提示 Toast

## 是否有原型设计

是（设计引导已开启）

## 实施步骤

1. **原型设计** — 加载 design-canvas 技能，设计个人主页改版 + 博客列表/详情页原型。完成后提交等待用户确认。
2. **图片加载修复 + 下载修复** — 修改 `next.config.ts` 添加 Supabase 图片域名白名单；所有图片组件添加 `onError` fallback；检查并修正资源下载字段映射。涉及文件：`next.config.ts`、`src/app/blog/[id]/page.tsx`、`src/app/about/page.tsx`、`src/app/resources/page.tsx`、`src/app/api/download/route.ts`
3. **个人主页改版** — 将 `/blog/[id]` 拆分为 Server Component（数据获取）+ Client Component（编辑交互+滚动动画），实现方形头像、左右分栏（笔记/作品）、自动滚动、编辑资料面板（含头像上传）。涉及文件：`src/app/blog/[id]/page.tsx`、新建 `src/components/profile-edit-dialog.tsx`
4. **博客模块开发** — 新增 `blogs` 和 `comments` 数据库表及 Drizzle schema；开发博客列表页 `/blogs`、博客详情页 `/blog-detail`（含评论区）；开发博客/评论 CRUD API。涉及文件：`src/storage/database/shared/schema.ts`、新建 `src/app/blogs/page.tsx`、新建 `src/app/blog-detail/page.tsx`、新建 `src/app/api/blogs/**/route.ts`
5. **导航栏更新 + 验证** — 导航栏增加"博客"独立入口；运行 lint + ts-check + build，确认所有功能正常。涉及文件：`src/components/navbar.tsx`

## 页面规格

##### @nav(web-topbar)
> type: topbar
> platform: web

- @page(/) 首页
- @page(/blogs) 博客
- @page(/notes) 笔记
- @page(/works) 作品
- @page(/resources) 资源库
- @page(/about) 关于站长

##### @page(/blog/[id]) 个人主页

**核心职责**：展示用户个人资料、公开笔记和作品，支持本人编辑。
**访问路径**：导航栏"个人主页"链接或从笔记/作品/博客卡片点击作者进入。`id` 为 Supabase auth.users.id。
**布局**：顶部返回链接 → 个人信息区（方形头像 + 姓名/简介/社交链接/编辑按钮）→ 下方左右分栏（左：公开笔记滚动列表，右：公开作品滚动列表）。
**列表项字段**：
- 笔记：标题 / 分类 / 日期 / 标签
- 作品：标题 / 封面图 / 分类 / 技术栈

**状态**：
- 空态："暂无公开笔记" / "暂无公开作品"
- 加载态：骨架屏
- 错误态：Toast 提示

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 返回链接 | 点击 | 跳转 @page(/blogs) | — | — |
| 编辑资料按钮 | 点击 | 弹出 @modal(profile-edit) | — | 仅本人可见 |
| 笔记卡片 | 点击 | 跳转 @page(/notes) 下对应笔记详情 | note_id | — |
| 作品卡片 | 点击 | 跳转 @page(/works) 下对应作品详情 | work_id | — |
| 滚动列表 | hover | 暂停自动滚动 | — | — |
| 滚动列表 | 离开 | 恢复自动滚动 | — | — |

**弹窗 profile-edit**：
- 方形头像上传区（支持文件选择后正方形预览）
- 输入框：姓名、简介、联系邮箱
- 输入框：GitHub URL、个人网站 URL、LinkedIn URL
- 操作：保存（调用 `/api/profile` PUT 更新）、取消（关闭弹窗）

##### @page(/blogs) 博客列表

**核心职责**：展示所有公开博客文章，支持分类筛选。
**访问路径**：导航栏"博客"直达。
**布局**：筛选标签栏（分类）→ 博客卡片列表（封面图 + 标题 + 摘要 + 作者 + 日期）。
**列表项字段**：封面图 / 标题 / 摘要 / 作者名 / 日期 / 分类标签

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 分类标签 | 点击 | 筛选对应分类的博客 | category | — |
| 博客卡片 | 点击 | 跳转 @page(/blog-detail)?blog_id | blog_id | — |
| 作者头像/名 | 点击 | 跳转 @page(/blog/[id]) | author_id | — |

##### @page(/blog-detail) 博客详情

**核心职责**：展示博客正文和评论区，支持评论和楼中楼回复。
**访问路径**：从博客列表点击卡片进入。`blog_id` 为查询参数。
**布局**：博客标题 + 作者信息 → 正文（Markdown 渲染）→ 评论区（评论列表 + 发表评论框 + 回复按钮）。

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 作者信息 | 点击 | 跳转 @page(/blog/[id]) | author_id | — |
| 发表评论 | 提交 | 新增评论并刷新列表 | blog_id, content | 需登录 |
| 回复按钮 | 点击 | 展开回复输入框 | parent_id | 楼中楼 |
| 回复提交 | 提交 | 新增楼中楼评论 | parent_id, content | 需登录 |
