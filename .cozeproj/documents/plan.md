# 个人主页改版 + 图片加载 + 下载修复计划

## 概述

修复个人主页（`/blog/[id]`）三个核心问题：1) 图片无法加载；2) 个人主页无法编辑资料/上传头像，且布局需改版（方形头像、笔记左右分栏+自动滚动）；3) 资源库下载功能不可用。同时"关于站长"页面（`/about`）图片加载问题一并修复。平台：web。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 个人主页架构 | Server Component + Client Component 混合 | 资料展示用 Server，编辑交互用 Client |
| 头像上传 | Supabase Storage TUS 上传 + 头像裁剪组件 | 已有 upload API 和 storage 基础设施 |
| 笔记/作品滚动 | CSS animation + Tailwind | 无需额外依赖，纯 CSS 实现无限滚动 |
| 图片域名 | 添加 Supabase Storage 域名到 next.config images | 图片来自 Supabase，需配置域名白名单 |
| 下载修复 | 检查 file_key/file_url 字段映射 + S3 签名 URL | 下载逻辑存在但可能 key 传值错误 |

## 功能模块

### 1. 图片加载修复

**问题**：`next/image` 使用了外部 Supabase Storage URL，未在 `next.config` 的 `images.remotePatterns` 中配置域名。

**方案**：在 `next.config.ts` 中添加 Supabase Storage 和 S3 的域名白名单。同时在头像展示处添加 fallback（加载失败显示首字母占位）。

### 2. 个人主页改版（`/blog/[id]`）

**问题**：当前页面是纯 Server Component，只展示头像首字母和笔记列表，无法编辑。

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
- 头像上传（方形裁剪）
- 姓名、简介、联系邮箱
- GitHub / 个人网站 / LinkedIn 链接
- 保存按钮

### 3. 资源库下载修复

**问题**：下载按钮点击后无反应或报错，可能原因：
- `file_key` 字段为空（S3 上传的资源 key 存储位置不对）
- `storage_type` 字段缺失导致 fallback 到 Supabase 逻辑
- S3 预签名 URL 生成失败

**方案**：
- 检查数据库中资源的 `file_key` / `file_url` / `storage_type` 字段实际值
- 确保 S3 上传时正确写入 `file_key` 和 `storage_type = "s3"`
- 下载时根据 `storage_type` 正确路由到 S3 或 Supabase 逻辑
- 添加错误提示 Toast

### 4. 关于站长页面图片

同问题 1，修复 `next/image` 域名配置即可。

## 是否有原型设计

是（设计引导已开启）

## 实施步骤

1. **原型设计** — 加载 design-canvas 技能，设计个人主页改版原型（方形头像、左右分栏+滚动、编辑面板）。完成后提交等待用户确认。
2. **图片加载修复** — 修改 `next.config.ts` 添加 Supabase/S3 图片域名白名单；头像加载失败时 fallback 到首字母占位。涉及文件：`next.config.ts`、`src/app/blog/[id]/page.tsx`
3. **个人主页改版** — 将 `/blog/[id]` 拆分为 Server Component（数据获取）+ Client Component（编辑交互+滚动动画），实现方形头像、左右分栏（笔记/作品）、自动滚动、编辑资料面板（含头像上传裁剪）。涉及文件：`src/app/blog/[id]/page.tsx`、新建 `src/components/profile-edit-dialog.tsx`
4. **资源库下载修复** — 检查并修正资源表字段映射，确保 `file_key` 和 `storage_type` 正确传递到下载 API；添加下载错误 Toast 提示。涉及文件：`src/app/resources/page.tsx`、`src/app/api/download/route.ts`
5. **验证** — lint + ts-check + build，确认图片加载、编辑功能、下载功能正常

## 页面规格

##### @nav(web-topbar)
> type: topbar
> platform: web

- @page(/) 首页
- @page(/notes) 博客
- @page(/works) 作品
- @page(/resources) 资源库
- @page(/about) 关于站长

##### @page(/blog/[id]) 个人主页

**核心职责**：展示用户个人资料、公开笔记和作品，支持本人编辑。
**访问路径**：导航栏"个人主页"链接或从笔记/作品卡片点击作者进入。`id` 为 Supabase auth.users.id。
**布局**：顶部返回链接 → 个人信息区（方形头像 + 姓名/简介/社交链接/编辑按钮）→ 下方左右分栏（左：公开笔记滚动列表，右：公开作品滚动列表）。
**列表项字段**：
- 笔记：标题 / 分类 / 日期 / 标签
- 作品：标题 / 封面图 / 分类 / 技术栈

**交互说明**

| 元素 | 动作 | 响应 | 传参 | 备注 |
|------|------|------|------|------|
| 返回链接 | 点击 | 跳转 @page(/notes) | — | — |
| 编辑资料按钮 | 点击 | 弹出 @modal(profile-edit) | — | 仅本人可见 |
| 笔记卡片 | 点击 | 跳转 @page(/notes) 下对应笔记详情 | note_id | — |
| 作品卡片 | 点击 | 跳转 @page(/works) 下对应作品详情 | work_id | — |
| 滚动列表 | hover | 暂停自动滚动 | — | — |
| 滚动列表 | 离开 | 恢复自动滚动 | — | — |

**弹窗 profile-edit**：
- 方形头像上传区（支持裁剪）
- 输入框：姓名、简介、联系邮箱
- 输入框：GitHub URL、个人网站 URL、LinkedIn URL
- 操作：保存（调用 `/api/profile` PUT 更新）、取消（关闭弹窗）
