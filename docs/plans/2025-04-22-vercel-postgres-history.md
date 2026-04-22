# Vercel Postgres History Storage Implementation Plan

> **Goal:** Replace localStorage-only history with persistent Vercel Postgres backend while maintaining localStorage as a cache.

**Architecture:**
- Vercel Postgres (Neon) stores all history data permanently
- localStorage acts as a client-side cache for offline resilience
- Write-through pattern: writes go to Postgres first, then localStorage
- Read-from-cache: reads come from localStorage, background sync from Postgres

**Tech Stack:**
- `@vercel/postgres` for database access
- 4 tables: `companies`, `packs`, `sequences`, `outcomes`
- Next.js App Router API routes for CRUD

---

## Task 1: Install Vercel Postgres SDK

**Files:**
- Modify: `package.json`

**Command:**
```bash
npm install @vercel/postgres
```

---

## Task 2: Create Database Schema

**Files:**
- Create: `lib/db/schema.sql`

**Schema:**
```sql
-- Companies table (normalized)
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  employee_count TEXT,
  erp_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, website)
);

-- Letter packs
CREATE TABLE IF NOT EXISTS packs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  recipient_name TEXT,
  contact_title TEXT,
  content TEXT NOT NULL, -- full letter content
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up sequences
CREATE TABLE IF NOT EXISTS sequences (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER REFERENCES packs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- 'initial', 'followup1', 'followup2', 'breakup'
  content TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'ready', 'sent'
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outcomes/responses
CREATE TABLE IF NOT EXISTS outcomes (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER REFERENCES packs(id) ON DELETE CASCADE,
  sent_date TIMESTAMP,
  response_date TIMESTAMP,
  response_type TEXT, -- 'positive', 'neutral', 'negative'
  meeting_booked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_packs_company ON packs(company_id);
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);
CREATE INDEX IF NOT EXISTS idx_sequences_pack ON sequences(pack_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_pack ON outcomes(pack_id);
```

---

## Task 3: Create Database Client

**Files:**
- Create: `lib/db/client.ts`

```typescript
import { sql } from '@vercel/postgres';

// Export configured sql client
export { sql };

// Helper for transactions
export async function withTransaction<T>(
  callback: (sql: typeof sql) => Promise<T>
): Promise<T> {
  await sql`BEGIN`;
  try {
    const result = await callback(sql);
    await sql`COMMIT`;
    return result;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}
```

---

## Task 4: Create Data Access Layer

**Files:**
- Create: `lib/db/history-db.ts`

```typescript
import { sql } from './client';

// Types matching existing history.ts
export type PackStatus = 'sent' | 'responded' | 'meeting' | 'not_interested' | 'no_response';
export type SequenceStage = 'pending' | 'generating' | 'ready' | 'sent';

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
  status?: PackStatus;
  sequenceStatus?: {
    initial: SequenceStage | 'locked';
    followup1: SequenceStage | 'locked';
    followup2: SequenceStage | 'locked';
    breakup: SequenceStage | 'locked';
  };
  sequenceContent?: {
    initial?: string;
    followup1?: string;
    followup2?: string;
    breakup?: string;
  };
  outcomes?: {
    sentDate?: string;
    responseDate?: string;
    responseType?: 'positive' | 'neutral' | 'negative';
    meetingBooked?: boolean;
    notes?: string;
  };
}

// Save a pack to Postgres
export async function savePackToDB(
  pack: Omit<SavedPack, 'id' | 'date'>
): Promise<SavedPack> {
  // Insert or get company
  const companyResult = await sql`
    INSERT INTO companies (name, website, industry, location, erp_score)
    VALUES (${pack.company}, ${pack.website ?? null}, ${pack.industry ?? null}, 
            ${pack.location ?? null}, ${pack.erpScore ?? null})
    ON CONFLICT (name, website) DO UPDATE SET
      industry = EXCLUDED.industry,
      location = EXCLUDED.location,
      erp_score = EXCLUDED.erp_score
    RETURNING id
  `;
  const companyId = companyResult.rows[0].id;

  // Insert pack
  const packResult = await sql`
    INSERT INTO packs (company_id, recipient_name, contact_title, content, status)
    VALUES (${companyId}, ${pack.recipientName}, ${pack.contactTitle}, 
            ${pack.completion}, ${pack.status ?? 'pending'})
    RETURNING id, created_at
  `;

  const saved: SavedPack = {
    ...pack,
    id: packResult.rows[0].id.toString(),
    date: packResult.rows[0].created_at,
  };

  return saved;
}

// Load all packs from Postgres
export async function loadHistoryFromDB(): Promise<SavedPack[]> {
  const result = await sql`
    SELECT 
      p.id,
      c.name as company,
      c.website,
      c.industry,
      c.location,
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
  `;

  return result.rows.map(row => ({
    id: row.id.toString(),
    company: row.company,
    recipientName: row.recipient_name,
    contactTitle: row.contact_title,
    date: row.date,
    completion: row.completion,
    website: row.website,
    location: row.location,
    industry: row.industry,
    erpScore: row.erp_score,
    status: row.status,
    outcomes: row.sent_date ? {
      sentDate: row.sent_date,
      responseDate: row.response_date,
      responseType: row.response_type,
      meetingBooked: row.meeting_booked,
      notes: row.notes,
    } : undefined,
  }));
}

// Update pack status
export async function updatePackStatusInDB(
  id: string, 
  status: PackStatus
): Promise<void> {
  await sql`
    UPDATE packs 
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

// Delete pack
export async function deletePackFromDB(id: string): Promise<void> {
  await sql`DELETE FROM packs WHERE id = ${id}`;
}

// Update outcome
export async function updateOutcomeInDB(
  packId: string,
  outcome: Partial<SavedPack['outcomes']>
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
```

---

## Task 5: Create API Routes

**Files:**
- Create: `app/api/history/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { loadHistoryFromDB, savePackToDB } from '@/lib/db/history-db';

export const dynamic = 'force-dynamic';

// GET /api/history - Load all packs
export async function GET() {
  try {
    const packs = await loadHistoryFromDB();
    return NextResponse.json({ packs });
  } catch (error) {
    console.error('Failed to load history:', error);
    return NextResponse.json(
      { error: 'Failed to load history' },
      { status: 500 }
    );
  }
}

// POST /api/history - Save a new pack
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const saved = await savePackToDB(body);
    return NextResponse.json({ pack: saved });
  } catch (error) {
    console.error('Failed to save pack:', error);
    return NextResponse.json(
      { error: 'Failed to save pack' },
      { status: 500 }
    );
  }
}
```

---

## Task 6: Create Update/Delete Routes

**Files:**
- Create: `app/api/history/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { updatePackStatusInDB, deletePackFromDB, updateOutcomeInDB } from '@/lib/db/history-db';

export const dynamic = 'force-dynamic';

// PATCH /api/history/[id] - Update pack
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (body.status) {
      await updatePackStatusInDB(id, body.status);
    }

    if (body.outcome) {
      await updateOutcomeInDB(id, body.outcome);
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
```

---

## Task 7: Update lib/history.ts with Sync Layer

**Files:**
- Modify: `lib/history.ts`

Replace the file to use write-through pattern:
- Keep localStorage as cache
- Add async functions that write to Postgres
- Sync from Postgres on load

---

## Task 8: Add Environment Variables Documentation

**Files:**
- Create: `.env.example`

```bash
# Vercel Postgres (auto-configured by Vercel when you add the integration)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NO_SSL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

---

## Task 9: Create Migration Utility

**Files:**
- Create: `app/api/history/migrate/route.ts`

One-time endpoint to migrate existing localStorage data to Postgres.

---

## Task 10: Test the Integration

**Steps:**
1. Set up Vercel Postgres via Vercel Dashboard
2. Run schema.sql in Vercel console
3. Test save/load/delete operations
4. Verify localStorage still works as cache

---

## Database Connection

After deploying to Vercel:
1. Go to Vercel Dashboard → Storage → Connect Database
2. Choose "Neon" (Postgres)
3. Vercel auto-injects environment variables
4. Run the schema setup
