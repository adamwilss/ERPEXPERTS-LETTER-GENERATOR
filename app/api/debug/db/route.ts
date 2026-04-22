import { NextResponse } from 'next/server';
import { getDbDebugInfo } from '@/lib/db/search-db';

export const dynamic = 'force-dynamic';

// GET /api/debug/db — Diagnostic endpoint for DB connectivity
export async function GET() {
  try {
    const info = await getDbDebugInfo();
    return NextResponse.json({
      ok: info.connected,
      ...info,
      env: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED),
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
