import { neon } from '@neondatabase/serverless';

// Create sql client from environment variable
// DATABASE_URL is auto-injected by Vercel when you connect Neon
export const sql = neon(process.env.DATABASE_URL!);

// Helper type for query results
export type QueryResult<T = Record<string, unknown>> = T[];

// Transaction helper (Neon supports regular SQL transactions)
export async function withTransaction<T>(
  callback: (sql: typeof neon) => Promise<T>
): Promise<T> {
  const transactionSql = neon(process.env.DATABASE_URL!);
  await transactionSql`BEGIN`;
  try {
    const result = await callback(transactionSql);
    await transactionSql`COMMIT`;
    return result;
  } catch (error) {
    await transactionSql`ROLLBACK`;
    throw error;
  }
}
