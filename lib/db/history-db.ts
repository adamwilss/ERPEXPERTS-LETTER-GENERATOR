import { getSql } from './client';

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

// Helper to handle neon results
function getFirstRow<T>(result: unknown): T | undefined {
  if (Array.isArray(result) && result.length > 0) {
    return result[0] as T;
  }
  return undefined;
}

function getRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  return [];
}

// Save a pack to Postgres - creates company if needed, then pack
export async function savePackToDB(
  pack: Omit<SavedPack, 'id' | 'date'>
): Promise<SavedPack> {
  const sql = getSql();

  // Try to find existing company by name (case-insensitive) and website
  const existingCompany = await sql`
    SELECT id FROM companies
    WHERE LOWER(name) = LOWER(${pack.company})
      AND COALESCE(website, '') = COALESCE(${pack.website ?? null}, '')
    LIMIT 1
  `;

  let companyId: number;
  const existingRow = getFirstRow<{ id: number }>(existingCompany);

  if (existingRow?.id) {
    companyId = existingRow.id;
    // Update company info
    await sql`
      UPDATE companies
      SET industry = COALESCE(${pack.industry ?? null}, industry),
          location = COALESCE(${pack.location ?? null}, location),
          employee_count = COALESCE(${pack.employees ?? null}, employee_count),
          erp_score = COALESCE(${pack.erpScore ?? null}, erp_score)
      WHERE id = ${companyId}
    `;
  } else {
    // Insert new company
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
      RETURNING id
    `;
    const newRow = getFirstRow<{ id: number }>(companyResult);
    if (!newRow?.id) {
      throw new Error('Failed to create company');
    }
    companyId = newRow.id;
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

  const packRow = getFirstRow<{ id: number; created_at: string }>(packResult);
  if (!packRow) {
    throw new Error('Failed to create pack');
  }

  const saved: SavedPack = {
    ...pack,
    id: packRow.id.toString(),
    date: packRow.created_at,
  };

  return saved;
}

// Load all packs from Postgres with related data
export async function loadHistoryFromDB(): Promise<SavedPack[]> {
  const sql = getSql();

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

  const rows = getRows<Record<string, unknown>>(result);

  return rows.map((row) => ({
    id: String(row.id ?? ''),
    company: String(row.company ?? ''),
    recipientName: String(row.recipient_name ?? ''),
    contactTitle: String(row.contact_title ?? ''),
    date: String(row.date ?? ''),
    completion: String(row.completion ?? ''),
    website: row.website ? String(row.website) : undefined,
    location: row.location ? String(row.location) : undefined,
    industry: row.industry ? String(row.industry) : undefined,
    employees: row.employees ? String(row.employees) : undefined,
    erpScore: row.erp_score ? Number(row.erp_score) : undefined,
    status: (row.status as PackStatus) || undefined,
    outcomes: row.sent_date ? {
      sentDate: String(row.sent_date),
      responseDate: row.response_date ? String(row.response_date) : undefined,
      responseType: row.response_type as OutcomeData['responseType'],
      meetingBooked: row.meeting_booked as boolean | undefined,
      notes: row.notes ? String(row.notes) : undefined,
    } : undefined,
  }));
}

// Load a single pack by ID
export async function loadPackById(id: string): Promise<SavedPack | null> {
  const sql = getSql();

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
    WHERE p.id = ${id}
    LIMIT 1
  `;

  const row = getFirstRow<Record<string, unknown>>(result);
  if (!row) return null;

  return {
    id: String(row.id ?? ''),
    company: String(row.company ?? ''),
    recipientName: String(row.recipient_name ?? ''),
    contactTitle: String(row.contact_title ?? ''),
    date: String(row.date ?? ''),
    completion: String(row.completion ?? ''),
    website: row.website ? String(row.website) : undefined,
    location: row.location ? String(row.location) : undefined,
    industry: row.industry ? String(row.industry) : undefined,
    employees: row.employees ? String(row.employees) : undefined,
    erpScore: row.erp_score ? Number(row.erp_score) : undefined,
    status: (row.status as PackStatus) || undefined,
    outcomes: row.sent_date ? {
      sentDate: String(row.sent_date),
      responseDate: row.response_date ? String(row.response_date) : undefined,
      responseType: row.response_type as OutcomeData['responseType'],
      meetingBooked: row.meeting_booked as boolean | undefined,
      notes: row.notes ? String(row.notes) : undefined,
    } : undefined,
  };
}

// Track a view on a shared pack page
export async function trackPackView(
  packId: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO pack_views (pack_id, ip_address, user_agent)
    VALUES (${packId}, ${ipAddress ?? null}, ${userAgent ?? null})
  `;
}

// Get view count for a pack
export async function getPackViewCount(packId: string): Promise<number> {
  const sql = getSql();
  const result = await sql`
    SELECT COUNT(*) as count FROM pack_views WHERE pack_id = ${packId}
  `;
  const row = getFirstRow<{ count: number }>(result);
  return row?.count ?? 0;
}

// Update pack status
export async function updatePackStatusInDB(
  id: string,
  status: PackStatus | undefined
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE packs
    SET status = ${status ?? null}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

// Delete pack (cascade will delete sequences and outcomes)
export async function deletePackFromDB(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM packs WHERE id = ${id}`;
}

// Clear all history (for testing/admin)
export async function clearAllHistoryFromDB(): Promise<void> {
  const sql = getSql();
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
  const sql = getSql();
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
  const sql = getSql();
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
  const sql = getSql();
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
  const sql = getSql();
  await sql`
    INSERT INTO sequences (pack_id, stage, content, status)
    VALUES (${packId}, ${stage}, ${content}, 'ready')
    ON CONFLICT (pack_id, stage) DO UPDATE SET
      content = EXCLUDED.content,
      status = 'ready',
      updated_at = CURRENT_TIMESTAMP
  `;
}

export async function loadSequencesForPack(
  packId: string
): Promise<SequenceStatus & { content: Record<string, string> }> {
  const sql = getSql();
  const result = await sql`
    SELECT stage, status, content
    FROM sequences
    WHERE pack_id = ${packId}
  `;

  const rows = getRows<Record<string, unknown>>(result);

  const sequences: SequenceStatus = {
    initial: 'locked',
    followup1: 'locked',
    followup2: 'locked',
    breakup: 'locked',
  };

  const content: Record<string, string> = {};

  for (const row of rows) {
    const stage = String(row.stage) as keyof SequenceStatus;
    sequences[stage] = row.status as SequenceStage | 'locked';
    if (row.content) {
      content[stage] = String(row.content);
    }
  }

  return { ...sequences, content };
}

// ── Research Cache ───────────────────────────────────────────────────────────

export interface CachedResearch {
  domain: string;
  contentJson: unknown;
  erpDetection: unknown;
  fetchedAt: string;
}

export async function loadResearchCache(domain: string): Promise<CachedResearch | null> {
  const sql = getSql();
  const domainHash = await hashDomain(domain);

  const result = await sql`
    SELECT domain, content_json, erp_detection, fetched_at
    FROM research_cache
    WHERE domain_hash = ${domainHash}
      AND fetched_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    LIMIT 1
  `;

  const row = getFirstRow<{
    domain: string;
    content_json: unknown;
    erp_detection: unknown;
    fetched_at: string;
  }>(result);

  if (!row) return null;

  return {
    domain: row.domain,
    contentJson: row.content_json,
    erpDetection: row.erp_detection,
    fetchedAt: row.fetched_at,
  };
}

export async function saveResearchCache(
  domain: string,
  contentJson: unknown,
  erpDetection: unknown
): Promise<void> {
  const sql = getSql();
  const domainHash = await hashDomain(domain);

  await sql`
    INSERT INTO research_cache (domain_hash, domain, content_json, erp_detection, fetched_at)
    VALUES (${domainHash}, ${domain}, ${JSON.stringify(contentJson)}, ${JSON.stringify(erpDetection)}, CURRENT_TIMESTAMP)
    ON CONFLICT (domain_hash) DO UPDATE SET
      domain = EXCLUDED.domain,
      content_json = EXCLUDED.content_json,
      erp_detection = EXCLUDED.erp_detection,
      fetched_at = EXCLUDED.fetched_at
  `;
}

async function hashDomain(domain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(domain.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
