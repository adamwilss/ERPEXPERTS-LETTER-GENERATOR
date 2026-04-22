import { NextResponse } from 'next/server';
import { loadLeadsForSearch } from '@/lib/db/search-db';

export const dynamic = 'force-dynamic';

// GET /api/searches/[id]/leads - Load leads for a search
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[API] Loading leads for search:', id);
    const leads = await loadLeadsForSearch(id);
    console.log('[API] Found', leads.length, 'leads');
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('[API] Failed to load leads:', error);
    return NextResponse.json(
      { error: 'Failed to load leads', details: String(error), leads: [] },
      { status: 500 }
    );
  }
}
