import { sql } from './client';

// Types matching existing history.ts
export type PackStatus = 'sent' | 'responded' | 'meeting' | 'not_interested' | 'no_response';
export type SequenceStage = 'pending' | 'generating' | 'ready' | 'sent';

export interface SequenceStatus {
  initial: SequenceStage | 'locked';
  followup1: SequenceStage | 'locked';
  followup2: SequenceStage | 'locked';
  breakup: SequenceStage | 'locked';
}

export interface OutcomeData {
  sentDate?: string;
  responseDate?: string;
  responseType?: 'positive' | 'neutral' | 'negative';
  meetingBooked?: boolean;
  notes?: string;
}

export interface SavedPack {
  id: string;
  company: string;
  recipientName: string;
  contactTitle: string;
  date: string;
  completion: string;
  erpScore?: number;
  website?: string;
  location?: string;
  industry?: string;
  employees?: string;
  status?: PackStatus;
  sequenceStatus?: SequenceStatus;
  sequenceContent?: {
    initial?: string;
    followup1?: string;
    followup2?: string;
    breakup?: string;
  };
  outcomes?: OutcomeData;
}

// Save a pack to Postgres - creates company if needed, then pack
export async function savePackToDB(
  pack: Omit<SavedPack, 'id' | 'date'>
): Promise<SavedPack> {
  // Insert or get company
  const companyResult = await sql`
    INSERT INTO companies (name, website, industry, location, employee_count, erp_score)
    VALUES (
      ${pack.company},
      ${pack.website ?? null},
      ${pack.industry ?? null},
      ${pack.location ?? null},
      ${pack.employees ?? null},
      ${pack.erpScore ?? null}
    )
    ON CONFLICT (name, COALESCE(website, '')) DO UPDATE SET
      industry = EXCLUDED.industry,
      location = EXCLUDED.location,
      employee_count = EXCLUDED.employee_count,
      erp_score = EXCLUDED.erp_score
    RETURNING id
  `;

  const companyId = companyResult[0]?.id;
  if (!companyId) {
    throw new Error('Failed to create or find company');
  }

  // Insert pack
  const packResult = await sql`
    INSERT INTO packs (company_id, recipient_name, contact_title, content, status)
    VALUES (
      ${companyId},
      ${pack.recipientName},
      ${pack.contactTitle},
      ${pack.completion},
      ${pack.status ?? 'pending'}
    )
    RETURNING id, created_at
  `;

  const saved: SavedPack = {
    ...pack,
    id: packResult[0].id.toString(),
    date: packResult[0].created_at,
  };

  return saved;
}

// Load all packs from Postgres with related data
export async function loadHistoryFromDB(): Promise<SavedPack[]> {
  const result = await sql`
    SELECT
      p.id,
      c.name as company,
      c.website,
      c.industry,
      c.location,
      c.employee_count as employees,
      c.erp_score,
      p.recipient_name,
      p.contact_title,
      p.content as completion,
      p.status,
      p.created_at as date,
      o.sent_date,
      o.response_date,
      o.response_type,
      o.meeting_booked,
      o.notes
    FROM packs p
    JOIN companies c ON p.company_id = c.id
    LEFT JOIN outcomes o ON o.pack_id = p.id
    ORDER BY p.created_at DESC
    LIMIT 100
  `;

  return result.map((row: Record<string, unknown>) => ({
    id: row.id?.toString() ?? '',
    company: row.company as string,
    recipientName: row.recipient_name as string,
    contactTitle: row.contact_title as string,
    date: row.date as string,
    completion: row.completion as string,
    website: row.website as string | undefined,
    location: row.location as string | undefined,
    industry: row.industry as string | undefined,
    employees: row.employees as string | undefined,
    erpScore: row.erp_score as number | undefined,
    status: row.status as PackStatus | undefined,
    outcomes: row.sent_date ? {
      sentDate: row.sent_date as string,
      responseDate: row.response_date as string | undefined,
      responseType: row.response_type as 'positive' | 'neutral' | 'negative' | undefined,
      meetingBooked: row.meeting_booked as boolean | undefined,
      notes: row.notes as string | undefined,
    } : undefined,
  }));
}

// Update pack status
export async function updatePackStatusInDB(
  id: string,
  status: PackStatus | undefined
): Promise<void> {
  await sql`
    UPDATE packs
    SET status = ${status ?? null}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

// Delete pack (cascade will delete sequences and outcomes)
export async function deletePackFromDB(id: string): Promise<void> {
  await sql`DELETE FROM packs WHERE id = ${id}`;
}

// Clear all history (for testing/admin)
export async function clearAllHistoryFromDB(): Promise<void> {
  await sql`DELETE FROM outcomes`;
  await sql`DELETE FROM sequences`;
  await sql`DELETE FROM packs`;
  await sql`DELETE FROM companies`;
}

// Update outcome data
export async function updateOutcomeInDB(
  packId: string,
  outcome: Partial<OutcomeData>
): Promise<void> {
  await sql`
    INSERT INTO outcomes (pack_id, sent_date, response_date, response_type, meeting_booked, notes)
    VALUES (
      ${packId},
      ${outcome.sentDate ?? null},
      ${outcome.responseDate ?? null},
      ${outcome.responseType ?? null},
      ${outcome.meetingBooked ?? false},
      ${outcome.notes ?? null}
    )
    ON CONFLICT (pack_id) DO UPDATE SET
      sent_date = EXCLUDED.sent_date,
      response_date = EXCLUDED.response_date,
      response_type = EXCLUDED.response_type,
      meeting_booked = EXCLUDED.meeting_booked,
      notes = EXCLUDED.notes,
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Sequence operations
export async function initializeSequenceInDB(packId: string): Promise<void> {
  // Create initial sequence entry
  await sql`
    INSERT INTO sequences (pack_id, stage, status)
    VALUES (${packId}, 'initial', 'pending')
    ON CONFLICT DO NOTHING
  `;
}

export async function updateSequenceStatusInDB(
  packId: string,
  stage: keyof SequenceStatus,
  status: SequenceStage | 'locked'
): Promise<void> {
  await sql`
    INSERT INTO sequences (pack_id, stage, status)
    VALUES (${packId}, ${stage}, ${status})
    ON CONFLICT (pack_id, stage) DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function updateSequenceContentInDB(
  packId: string,
  stage: keyof SequenceStatus,
  content: string
): Promise<void> {
  await sql`
    INSERT INTO sequences (pack_id, stage, content, status)
    VALUES (${packId}, ${stage}, ${content}, 'ready')
    ON CONFLICT (pack_id, stage) DO UPDATE SET
      content = EXCLUDED.content,
      status = 'ready',
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function loadSequencesForPack(packId: string): Promise<SequenceStatus & { content: Record<string, string> }> {
  const result = await sql`
    SELECT stage, status, content
    FROM sequences
    WHERE pack_id = ${packId}
  `;

  const sequences: SequenceStatus = {
    initial: 'locked',
    followup1: 'locked',
    followup2: 'locked',
    breakup: 'locked',
  };

  const content: Record<string, string> = {};

  for (const row of result as Record<string, unknown>[]) {
    const stage = row.stage as keyof SequenceStatus;
    sequences[stage] = row.status as SequenceStage | 'locked';
    if (row.content) {
      content[stage] = row.content as string;
    }
  }

  return { ...sequences, content };
}
