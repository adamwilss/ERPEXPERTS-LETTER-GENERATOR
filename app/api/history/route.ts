import { NextResponse } from 'next/server';
import { loadHistoryFromDB, savePackToDB, type SavedPack } from '@/lib/db/history-db';

export const dynamic = 'force-dynamic';

// GET /api/history - Load all packs
export async function GET() {
  try {
    const packs = await loadHistoryFromDB();
    return NextResponse.json({ packs });
  } catch (error) {
    console.error('Failed to load history:', error);
    return NextResponse.json(
      { error: 'Failed to load history', packs: [] },
      { status: 500 }
    );
  }
}

// POST /api/history - Save a new pack
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.company || !body.completion) {
      return NextResponse.json(
        { error: 'Missing required fields: company, completion' },
        { status: 400 }
      );
    }

    const packData: Omit<SavedPack, 'id' | 'date'> = {
      company: body.company,
      recipientName: body.recipientName ?? '',
      contactTitle: body.contactTitle ?? '',
      completion: body.completion,
      website: body.website,
      location: body.location,
      industry: body.industry,
      employees: body.employees,
      erpScore: body.erpScore,
      status: body.status ?? 'pending',
    };

    const saved = await savePackToDB(packData);
    return NextResponse.json({ pack: saved, success: true });
  } catch (error) {
    console.error('Failed to save pack:', error);
    return NextResponse.json(
      { error: 'Failed to save pack' },
      { status: 500 }
    );
  }
}
