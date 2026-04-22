import { NextResponse } from 'next/server';
import { saveSearchWithLeads, loadSavedSearches, loadLeadsForSearch } from '@/lib/db/search-db';

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

    const result = await saveSearchWithLeads(body.params, body.leads);
    return NextResponse.json({
      success: true,
      search: result.search,
      leadCount: result.leads.length
    });
  } catch (error) {
    console.error('Failed to save search:', error);
    return NextResponse.json(
      { error: 'Failed to save search', details: String(error) },
      { status: 500 }
    );
  }
}
