import { NextResponse } from 'next/server';
import { loadPackById, trackPackView, getPackViewCount } from '@/lib/db/history-db';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/view/[id] - Load a pack for the shareable view page + track view
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const pack = await loadPackById(id);

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    // Track view
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent');
    await trackPackView(id, ipAddress, userAgent).catch(() => {
      // Silently ignore tracking errors
    });

    const viewCount = await getPackViewCount(id);

    return NextResponse.json({ pack, viewCount });
  } catch (error) {
    console.error('Failed to load pack:', error);
    return NextResponse.json(
      { error: 'Failed to load pack' },
      { status: 500 }
    );
  }
}
