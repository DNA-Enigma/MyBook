# 项目概览

个人综合服务门户 — 基于 Next.js 16 + Supabase 构建的全栈应用，支持多用户注册登录、笔记管理、作品展示、综合资源库、个人简介四大核心模块。

## 技术栈

| 维度 | 选择 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 核心 | React 19 |
| 语言 | TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 4 |
| 数据库 | Supabase PostgreSQL (Drizzle ORM) |
| 认证 | Supabase Auth |
| 文件存储 | Supabase Storage |
| 包管理 | pnpm |

## 目录结构

```
src/
  app/                  # 页面路由
    api/                # API Routes
      auth/             # 认证相关 (login, register, logout, me)
      notes/            # 笔记 CRUD
      works/            # 作品 CRUD
      resources/        # 资源 CRUD
      upload/           # 文件上传
      download/         # 文件下载签名URL
      profile/          # 个人资料更新
    login/              # 登录页
    register/           # 注册页
    notes/              # 笔记列表/详情/编辑
    works/              # 作品展示/详情
    resources/          # 资源库
    profile/            # 个人简介
    page.tsx            # 首页
    layout.tsx          # 根布局 (含导航栏)
  components/
    ui/                 # shadcn/ui 组件库
    navbar.tsx          # 顶部导航栏
  hooks/
    use-auth.tsx        # 认证状态管理 (React Context)
  lib/
    utils.ts            # cn 等工具函数
    supabase.ts         # Supabase 客户端
    storage.ts          # 文件存储操作
  storage/database/
    shared/schema.ts    # Drizzle 表定义
    shared/relations.ts # 表关系定义
    supabase-client.ts  # DB 客户端 (Drizzle)
```

## 数据库表

- `profiles` — 用户资料（id, email, name, role, bio, skills, avatar_url, contact_email, github_url, website_url, linkedin_url, created_at, updated_at）
- `notes` — 笔记（id, title, content, category, tags, is_public, author_id, created_at, updated_at）
- `works` — 作品（id, title, description, cover_image_url, category, tech_stack, external_link, is_public, created_at, updated_at）
- `resources` — 资源（id, name, description, file_url, file_key, file_type, file_size, category, docker_pull_cmd, download_count, is_public, created_at, updated_at）

## 环境变量

通过 `.env.local` 配置（自动从 coze_workload_identity 获取）：
- `COZE_SUPABASE_URL`
- `COZE_SUPABASE_ANON_KEY`
- `COZE_SUPABASE_SERVICE_ROLE_KEY`
- `COZE_BUCKET_NAME`

## 认证流程

1. 注册 → `/api/auth/register` → Supabase Auth 创建用户 → 触发器自动创建 profile
2. 登录 → `/api/auth/register` 返回 access_token → 前端存入 cookie
3. 状态管理 → `use-auth.tsx` 通过 `/api/auth/me` 获取当前用户
4. 登出 → 清除 cookie

## 权限设计

- 服务端 API 使用 `supabaseAdmin` (service_role_key) 绕过 RLS
- 前端操作按钮按 `useAuth().isAdmin` 条件渲染
- 数据库 RLS 策略：公开内容所有人可读，登录用户可操作自己的数据

## 关键文件与函数

| 功能 | 文件 | 函数/组件 |
|------|------|----------|
| 登录 | `src/app/api/auth/login/route.ts` | POST handler |
| 注册 | `src/app/api/auth/register/route.ts` | POST handler |
| 获取当前用户 | `src/app/api/auth/me/route.ts` | GET handler |
| 认证状态 | `src/hooks/use-auth.tsx` | AuthProvider, useAuth |
| 导航栏 | `src/components/navbar.tsx` | Navbar (Client Component) |
| 文件上传 | `src/app/api/upload/route.ts` | POST handler |
| 文件下载 | `src/app/api/download/route.ts` | GET handler |
| Supabase 客户端 | `src/lib/supabase.ts` | supabaseAdmin, supabaseAnon |
| Storage 操作 | `src/lib/storage.ts` | uploadFile, getSignedDownloadUrl |

## 开发命令

```bash
pnpm dev          # 启动开发服务器 (端口 5000)
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # ESLint 检查
pnpm ts-check     # TypeScript 类型检查
```

## 常见问题

1. **use-auth.tsx 必须是 .tsx 扩展名**：该文件包含 JSX 语法（`<AuthContext.Provider>`），不能命名为 `.ts`
2. **环境变量读取**：Supabase 和 Storage 的环境变量通过 `coze_workload_identity` 自动注入，写入 `.env.local`
3. **外键关系**：`notes.author_id` 外键关联 `auth.users(id)`，`profiles.id` 也关联 `auth.users(id)`
4. **JOIN 查询限制**：Supabase 的自动 JOIN (`select("*, profiles(...)")`) 需要正确的外键关系，否则改用手动关联
