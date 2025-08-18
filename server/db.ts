import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Production SSL configuration for AWS RDS
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Connection pool settings for production
  max: isProduction ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });