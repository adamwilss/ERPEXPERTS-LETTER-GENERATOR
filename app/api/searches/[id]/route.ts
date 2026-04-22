import { NextResponse } from 'next/server';
import { deleteSearch } from '@/lib/db/search-db';

export const dynamic = 'force-dynamic';

// DELETE /api/searches/[id] - Delete a search
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSearch(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete search:', error);
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    );
  }
}
