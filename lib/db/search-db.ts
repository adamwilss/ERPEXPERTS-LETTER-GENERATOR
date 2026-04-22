import { getSql } from './client';

// Helper to handle neon results
function getFirstRow<T>(result: unknown): T | undefined {
  if (Array.isArray(result) && result.length > 0) {
    return result[0] as T;
  }
  return undefined;
}

export interface SavedSearch {
  id: string;
  industry: string;
  employeeRange: string;
  location: string;
  keywords: string;
  createdAt: string;
}

export interface SavedLead {
  id: string;
  searchId: string;
  company: string;
  website: string;
  industry: string;
  employees: string;
  description: string;
  erpScore: number;
  location?: string;
  contactName?: string;
  contactTitle: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  postalAddress?: string;
  createdAt: string;
  generated?: boolean;
}

// Save a search and its leads
export async function saveSearchWithLeads(
  params: { industry: string; employeeRange: string; location: string; keywords: string },
  leads: Omit<SavedLead, 'id' | 'searchId' | 'createdAt'>[]
): Promise<{ search: SavedSearch; leads: SavedLead[] }> {
  const sql = getSql();

  console.log('[DB] Starting saveSearchWithLeads with', leads.length, 'leads');
  console.log('[DB] Params:', params);

  // Insert search
  console.log('[DB] Inserting search...');
  const searchResult = await sql`
    INSERT INTO searches (industry, employee_range, location, keywords)
    VALUES (${params.industry}, ${params.employeeRange}, ${params.location}, ${params.keywords})
    RETURNING id, created_at
  `;

  console.log('[DB] Search insert result:', searchResult);

  const searchRow = getFirstRow<{ id: number; created_at: string }>(searchResult);
  if (!searchRow) {
    throw new Error('Failed to create search - no row returned');
  }
  // Keep as INTEGER for Postgres foreign key column — do NOT convert to string
  const searchId = searchRow.id;
  console.log('[DB] Created search with ID:', searchId);

  const search: SavedSearch = {
    id: searchId.toString(),
    industry: params.industry,
    employeeRange: params.employeeRange,
    location: params.location,
    keywords: params.keywords,
    createdAt: searchRow.created_at,
  };

  // Insert all leads using a transaction for atomicity and reliability
  // The neon HTTP driver handles concurrent individual queries poorly,
  // so we batch them into a single transaction request.
  const savedLeads: SavedLead[] = [];
  console.log('[DB] Building', leads.length, 'insert queries for transaction');

  const insertQueries = leads.map((lead) => sql`
    INSERT INTO search_leads (
      search_id, company, website, industry, employees, description,
      erp_score, location, contact_name, contact_title, contact_email,
      contact_linkedin, postal_address
    )
    VALUES (
      ${searchId}, ${lead.company}, ${lead.website}, ${lead.industry},
      ${lead.employees}, ${lead.description}, ${lead.erpScore ?? 0},
      ${lead.location ?? null}, ${lead.contactName ?? null}, ${lead.contactTitle ?? null},
      ${lead.contactEmail ?? null}, ${lead.contactLinkedIn ?? null}, ${lead.postalAddress ?? null}
    )
    RETURNING id, created_at
  `);

  try {
    console.log('[DB] Executing transaction with', insertQueries.length, 'queries');
    const txResults = await getSql().transaction(insertQueries);
    console.log('[DB] Transaction completed. Results count:', txResults.length);

    for (let i = 0; i < txResults.length; i++) {
      const rows = txResults[i] as unknown[];
      const row = getFirstRow<{ id: number; created_at: string }>(rows);
      if (row) {
        savedLeads.push({
          ...leads[i],
          id: row.id.toString(),
          searchId: searchId.toString(),
          createdAt: row.created_at,
          generated: false,
        } as SavedLead);
      } else {
        console.error('[DB] No row returned for lead index', i, 'company:', leads[i].company, 'result:', rows);
      }
    }
  } catch (txErr) {
    console.error('[DB] Transaction failed:', txErr);
    console.log('[DB] Falling back to sequential inserts...');

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      try {
        const leadResult = await sql`
          INSERT INTO search_leads (
            search_id, company, website, industry, employees, description,
            erp_score, location, contact_name, contact_title, contact_email,
            contact_linkedin, postal_address
          )
          VALUES (
            ${searchId}, ${lead.company}, ${lead.website}, ${lead.industry},
            ${lead.employees}, ${lead.description}, ${lead.erpScore ?? 0},
            ${lead.location ?? null}, ${lead.contactName ?? null}, ${lead.contactTitle ?? null},
            ${lead.contactEmail ?? null}, ${lead.contactLinkedIn ?? null}, ${lead.postalAddress ?? null}
          )
          RETURNING id, created_at
        `;
        const row = getFirstRow<{ id: number; created_at: string }>(leadResult);
        if (row) {
          savedLeads.push({
            ...lead,
            id: row.id.toString(),
            searchId: searchId.toString(),
            createdAt: row.created_at,
            generated: false,
          } as SavedLead);
        } else {
          console.error('[DB] No row returned for lead (sequential):', lead.company, 'result:', leadResult);
        }
      } catch (innerErr) {
        console.error('[DB] Sequential insert failed for lead', lead.company, ':', innerErr);
      }
    }
  }

  console.log('[DB] Finished. Saved', savedLeads.length, 'out of', leads.length, 'leads');
  return { search, leads: savedLeads };
}

// Debug endpoint helper: check DB connectivity and counts
export async function getDbDebugInfo(): Promise<{
  connected: boolean;
  searchesTable: boolean;
  searchLeadsTable: boolean;
  searchCount: number;
  leadCount: number;
  sampleSearchId?: number;
  sampleSearchLeadCount?: number;
  error?: string;
}> {
  const sql = getSql();
  try {
    // Check if tables exist
    const tableResult = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('searches', 'search_leads')
    `;
    const tables = (tableResult as unknown[]).map((r: any) => r.table_name);

    // Count rows
    const searchCountResult = await sql`SELECT COUNT(*) as count FROM searches`;
    const searchCount = Number((searchCountResult as any[])[0]?.count ?? 0);

    const leadCountResult = await sql`SELECT COUNT(*) as count FROM search_leads`;
    const leadCount = Number((leadCountResult as any[])[0]?.count ?? 0);

    // Get a sample search to verify FK integrity
    let sampleSearchId: number | undefined;
    let sampleSearchLeadCount: number | undefined;
    if (searchCount > 0) {
      const sampleResult = await sql`SELECT id FROM searches LIMIT 1`;
      const sampleRow = getFirstRow<{ id: number }>(sampleResult as unknown[]);
      if (sampleRow) {
        sampleSearchId = sampleRow.id;
        const sampleLeadsResult = await sql`SELECT COUNT(*) as count FROM search_leads WHERE search_id = ${sampleSearchId}`;
        sampleSearchLeadCount = Number((sampleLeadsResult as any[])[0]?.count ?? 0);
      }
    }

    return {
      connected: true,
      searchesTable: tables.includes('searches'),
      searchLeadsTable: tables.includes('search_leads'),
      searchCount,
      leadCount,
      sampleSearchId,
      sampleSearchLeadCount,
    };
  } catch (err) {
    return {
      connected: false,
      searchesTable: false,
      searchLeadsTable: false,
      searchCount: 0,
      leadCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Load all saved searches
export async function loadSavedSearches(): Promise<SavedSearch[]> {
  const sql = getSql();

  console.log('[DB] Loading saved searches');
  const result = await sql`
    SELECT id, industry, employee_range, location, keywords, created_at
    FROM searches
    ORDER BY created_at DESC
    LIMIT 50
  `;

  console.log('[DB] Found', (result as unknown[]).length, 'searches');

  return (result as Record<string, unknown>[]).map(row => ({
    id: String(row.id),
    industry: String(row.industry),
    employeeRange: String(row.employee_range),
    location: String(row.location),
    keywords: String(row.keywords ?? ''),
    createdAt: String(row.created_at),
  }));
}

// Load leads for a specific search
export async function loadLeadsForSearch(searchId: string): Promise<SavedLead[]> {
  const sql = getSql();

  console.log('[DB] Loading leads for search_id:', searchId);

  // Convert to integer for Postgres
  const numericId = parseInt(searchId, 10);
  if (isNaN(numericId)) {
    console.error('[DB] Invalid search ID:', searchId);
    return [];
  }

  const result = await sql`
    SELECT
      id, search_id, company, website, industry, employees,
      description, erp_score, location, contact_name, contact_title,
      contact_email, contact_linkedin, postal_address, created_at, generated
    FROM search_leads
    WHERE search_id = ${numericId}
    ORDER BY erp_score DESC
  `;

  console.log('[DB] Query returned', (result as unknown[]).length, 'rows');

  return (result as Record<string, unknown>[]).map(row => ({
    id: String(row.id),
    searchId: String(row.search_id),
    company: String(row.company),
    website: String(row.website),
    industry: String(row.industry),
    employees: String(row.employees),
    description: String(row.description),
    erpScore: Number(row.erp_score),
    location: row.location ? String(row.location) : undefined,
    contactName: row.contact_name ? String(row.contact_name) : undefined,
    contactTitle: String(row.contact_title),
    contactEmail: row.contact_email ? String(row.contact_email) : undefined,
    contactLinkedIn: row.contact_linkedin ? String(row.contact_linkedin) : undefined,
    postalAddress: row.postal_address ? String(row.postal_address) : undefined,
    createdAt: String(row.created_at),
    generated: Boolean(row.generated),
  }));
}

// Mark lead as generated
export async function markLeadAsGenerated(leadId: string): Promise<void> {
  const sql = getSql();
  const numericId = parseInt(leadId, 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid lead ID: ${leadId}`);
  }
  await sql`
    UPDATE search_leads
    SET generated = true
    WHERE id = ${numericId}
  `;
}

// Delete a search and its leads
export async function deleteSearch(searchId: string): Promise<void> {
  const sql = getSql();
  const numericId = parseInt(searchId, 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid search ID: ${searchId}`);
  }
  await sql`DELETE FROM searches WHERE id = ${numericId}`;
}
