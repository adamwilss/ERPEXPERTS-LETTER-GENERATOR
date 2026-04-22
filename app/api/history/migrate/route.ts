import { NextResponse } from 'next/server';
import { savePackToDB, type SavedPack } from '@/lib/db/history-db';

export const dynamic = 'force-dynamic';

// POST /api/history/migrate - Migrate localStorage packs to Postgres
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const packs: SavedPack[] = body.packs ?? [];

    if (packs.length === 0) {
      return NextResponse.json(
        { error: 'No packs provided for migration' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Migrate each pack
    for (const pack of packs) {
      try {
        await savePackToDB({
          company: pack.company,
          recipientName: pack.recipientName,
          contactTitle: pack.contactTitle,
          completion: pack.completion,
          website: pack.website,
          location: pack.location,
          industry: pack.industry,
          employees: pack.employees,
          erpScore: pack.erpScore,
          status: pack.status,
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to migrate ${pack.company}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      migrated: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit error output
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
