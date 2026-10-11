import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@honeychain/shared";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// Max 3 connections to strictly respect Supabase free tier connection limits
export const pgClient = postgres(connectionString, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(pgClient, { schema });
