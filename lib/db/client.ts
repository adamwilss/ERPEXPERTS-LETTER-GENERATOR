import { neon } from '@neondatabase/serverless';

// Create sql client from environment variable
// DATABASE_URL is auto-injected by Vercel when you connect Neon
export const sql = neon(process.env.DATABASE_URL!);

// Helper type for query results
export type QueryResult<T = Record<string, unknown>> = T[];
