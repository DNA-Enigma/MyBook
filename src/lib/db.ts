import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/storage/database/shared/schema";
import { loadEnv } from "@/storage/database/supabase-client";

// 确保环境变量已加载（PGDATABASE_URL 通过 coze_workload_identity 注入）
loadEnv();

const pool = new Pool({
  connectionString: process.env.PGDATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

export const db = drizzle(pool, { schema });
