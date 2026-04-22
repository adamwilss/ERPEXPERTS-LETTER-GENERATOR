import { NextResponse } from 'next/server';
import {
  updatePackStatusInDB,
  deletePackFromDB,
  updateOutcomeInDB,
  updateSequenceStatusInDB,
  updateSequenceContentInDB,
  type OutcomeData,
  type SequenceStage,
  type SequenceStatus,
} from '@/lib/db/history-db';

export const dynamic = 'force-dynamic';

// PATCH /api/history/[id] - Update pack status, outcome, or sequence
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Handle status update
    if (body.status !== undefined) {
      await updatePackStatusInDB(id, body.status);
    }

    // Handle outcome update
    if (body.outcome) {
      const outcome: Partial<OutcomeData> = body.outcome;
      await updateOutcomeInDB(id, outcome);
    }

    // Handle sequence status update
    if (body.sequenceStage && body.sequenceStatus) {
      await updateSequenceStatusInDB(
        id,
        body.sequenceStage as keyof SequenceStatus,
        body.sequenceStatus as SequenceStage | 'locked'
      );
    }

    // Handle sequence content update
    if (body.sequenceStage && body.sequenceContent) {
      await updateSequenceContentInDB(
        id,
        body.sequenceStage as keyof SequenceStatus,
        body.sequenceContent as string
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update pack:', error);
    return NextResponse.json(
      { error: 'Failed to update pack' },
      { status: 500 }
    );
  }
}

// DELETE /api/history/[id] - Delete pack
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await deletePackFromDB(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete pack:', error);
    return NextResponse.json(
      { error: 'Failed to delete pack' },
      { status: 500 }
    );
  }
}
