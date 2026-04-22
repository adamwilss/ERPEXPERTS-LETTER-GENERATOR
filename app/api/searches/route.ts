import { NextResponse } from 'next/server';
import { saveSearchWithLeads, loadSavedSearches } from '@/lib/db/search-db';

export const dynamic = 'force-dynamic';

// GET /api/searches - Load all saved searches
export async function GET() {
  try {
    const searches = await loadSavedSearches();
    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Failed to load searches:', error);
    return NextResponse.json(
      { error: 'Failed to load searches', searches: [] },
      { status: 500 }
    );
  }
}

// POST /api/searches - Save a new search with leads
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.params || !body.leads || !Array.isArray(body.leads)) {
      return NextResponse.json(
        { error: 'Missing params or leads array' },
        { status: 400 }
      );
    }

    console.log('[API] Saving search with', body.leads.length, 'leads');
    console.log('[API] First lead sample:', JSON.stringify(body.leads[0], null, 2));

    const result = await saveSearchWithLeads(body.params, body.leads);
    console.log('[API] Saved search:', result.search.id, 'with', result.leads.length, 'leads');

    return NextResponse.json({
      success: true,
      search: result.search,
      leadCount: result.leads.length
    });
  } catch (error) {
    console.error('[API] Failed to save search:', error);
    return NextResponse.json(
      {
        error: 'Failed to save search',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
