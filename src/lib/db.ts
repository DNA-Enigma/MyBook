import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/storage/database/shared/schema";

const pool = new Pool({
  connectionString: process.env.PGDATABASE_URL,
});

export const db = drizzle(pool, { schema });
