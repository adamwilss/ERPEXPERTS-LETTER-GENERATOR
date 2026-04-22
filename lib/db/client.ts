import { neon } from '@neondatabase/serverless';

// Use DATABASE_URL_UNPOOLED for serverless functions (Vercel)
// Falls back to DATABASE_URL if unpooled not available
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set');
  }
  return url;
}

// Create sql client lazily - only when first used
let sqlInstance: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sqlInstance) {
    sqlInstance = neon(getDatabaseUrl());
  }
  return sqlInstance;
}

// Export sql as a callable that lazily initializes
// This avoids errors during build when env vars aren't available
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
  return getSql()(strings, ...values);
}) as ReturnType<typeof neon>;

// Helper type for query results
export type QueryResult<T = Record<string, unknown>> = T[];
