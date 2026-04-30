import { pgTable, serial, timestamp, text, varchar, boolean, jsonb, integer, bigint, index } from "drizzle-orm/pg-core"
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
    category: varchar("category", { length: 50 }).notNull().default("开发"),
    tech_stack: jsonb("tech_stack"),
    external_link: text("external_link"),
    is_public: boolean("is_public").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("works_category_idx").on(table.category),
    index("works_is_public_idx").on(table.is_public),
    index("works_created_at_idx").on(table.created_at),
  ]
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
    docker_pull_cmd: text("docker_pull_cmd"),
    download_count: integer("download_count").notNull().default(0),
    is_public: boolean("is_public").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("resources_category_idx").on(table.category),
    index("resources_is_public_idx").on(table.is_public),
    index("resources_created_at_idx").on(table.created_at),
  ]
);
