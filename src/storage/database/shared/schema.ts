import { pgTable, serial, timestamp, text, varchar, boolean, jsonb, integer, bigint, index, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 128 }),
    avatar_url: text("avatar_url"),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    bio: text("bio"),
    skills: jsonb("skills"),
    contact_email: varchar("contact_email", { length: 255 }),
    github_url: text("github_url"),
    website_url: text("website_url"),
    linkedin_url: text("linkedin_url"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("profiles_email_idx").on(table.email),
    index("profiles_role_idx").on(table.role),
  ]
);

export const notes = pgTable(
  "notes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 50 }).notNull().default("随笔"),
    tags: jsonb("tags"),
    is_public: boolean("is_public").notNull().default(true),
    author_id: varchar("author_id", { length: 36 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("notes_author_id_idx").on(table.author_id),
    index("notes_category_idx").on(table.category),
    index("notes_is_public_idx").on(table.is_public),
    index("notes_created_at_idx").on(table.created_at),
  ]
);

export const works = pgTable(
  "works",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    cover_image_url: text("cover_image_url"),
    images: jsonb("images"),
    category: varchar("category", { length: 50 }).notNull().default("开发"),
    work_type: varchar("work_type", { length: 30 }).notNull().default("project"),
    tech_stack: jsonb("tech_stack"),
    external_link: text("external_link"),
    author_id: text("author_id").references(() => profiles.id, { onDelete: "set null" }),
    is_public: boolean("is_public").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("works_category_idx").on(table.category),
    index("works_is_public_idx").on(table.is_public),
    index("works_created_at_idx").on(table.created_at),
    index("works_author_id_idx").on(table.author_id),
  ]
);

export const blogs = pgTable(
  "blogs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }),
    summary: text("summary"),
    content: text("content").notNull(),
    cover_image_url: text("cover_image_url"),
    category: varchar("category", { length: 50 }).notNull().default("技术分享"),
    tags: jsonb("tags"),
    author_id: varchar("author_id", { length: 36 }).notNull(),
    view_count: integer("view_count").notNull().default(0),
    like_count: integer("like_count").notNull().default(0),
    is_public: boolean("is_public").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("blogs_author_id_idx").on(table.author_id),
    index("blogs_category_idx").on(table.category),
    index("blogs_is_public_idx").on(table.is_public),
    index("blogs_created_at_idx").on(table.created_at),
    index("blogs_slug_idx").on(table.slug),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    blog_id: varchar("blog_id", { length: 36 }).notNull(),
    parent_id: varchar("parent_id", { length: 36 }),
    author_id: varchar("author_id", { length: 36 }).notNull(),
    author_name: varchar("author_name", { length: 128 }),
    author_avatar: text("author_avatar"),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("comments_blog_id_idx").on(table.blog_id),
    index("comments_parent_id_idx").on(table.parent_id),
    index("comments_author_id_idx").on(table.author_id),
    index("comments_created_at_idx").on(table.created_at),
  ]
);

export const resourceTypes = pgTable(
  "resource_types",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull().unique(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const resources = pgTable(
  "resources",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    file_url: text("file_url"),
    file_key: text("file_key"),
    file_type: varchar("file_type", { length: 50 }),
    file_size: bigint("file_size", { mode: "number" }),
    category: varchar("category", { length: 50 }).notNull().default("software"),
    author_id: varchar("author_id", { length: 36 }),
    status: varchar("status", { length: 20 }).notNull().default("approved"),
    docker_pull_cmd: text("docker_pull_cmd"),
    download_count: integer("download_count").notNull().default(0),
    is_public: boolean("is_public").notNull().default(true),
    storage_type: varchar("storage_type", { length: 20 }).notNull().default("supabase"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("resources_category_idx").on(table.category),
    index("resources_is_public_idx").on(table.is_public),
    index("resources_created_at_idx").on(table.created_at),
  ]
);
