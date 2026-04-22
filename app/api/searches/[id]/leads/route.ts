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
    const leads = await loadLeadsForSearch(id);
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Failed to load leads:', error);
    return NextResponse.json(
      { error: 'Failed to load leads', leads: [] },
      { status: 500 }
    );
  }
}
