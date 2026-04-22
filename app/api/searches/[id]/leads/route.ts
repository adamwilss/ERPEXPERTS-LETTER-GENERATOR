import { NextResponse } from 'next/server';
import { loadLeadsForSearch, updateLeadStatus } from '@/lib/db/search-db';

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
      {
        error: 'Failed to load leads',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        leads: []
      },
      { status: 500 }
    );
  }
}

// PATCH /api/searches/[id]/leads - Update lead status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.leadId || !body.status) {
      return NextResponse.json(
        { error: 'Missing leadId or status' },
        { status: 400 }
      );
    }

    console.log('[API] Updating lead', body.leadId, 'to status', body.status, 'in search', id);
    await updateLeadStatus(body.leadId, body.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to update lead status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update lead status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
