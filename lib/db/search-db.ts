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
  const searchId = searchRow.id.toString();
  console.log('[DB] Created search with ID:', searchId);

  const search: SavedSearch = {
    id: searchId,
    industry: params.industry,
    employeeRange: params.employeeRange,
    location: params.location,
    keywords: params.keywords,
    createdAt: searchRow.created_at,
  };

  // Insert all leads
  const savedLeads: SavedLead[] = [];
  console.log('[DB] Starting to insert', leads.length, 'leads');

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    console.log(`[DB] Processing lead ${i + 1}/${leads.length}:`, lead.company);

    try {
      console.log('[DB] Executing INSERT for:', lead.company);
      const leadResult = await sql`
        INSERT INTO search_leads (
          search_id, company, website, industry, employees, description,
          erp_score, location, contact_name, contact_title, contact_email,
          contact_linkedin, postal_address
        )
        VALUES (
          ${searchId}, ${lead.company}, ${lead.website}, ${lead.industry},
          ${lead.employees}, ${lead.description}, ${lead.erpScore},
          ${lead.location ?? null}, ${lead.contactName ?? null}, ${lead.contactTitle},
          ${lead.contactEmail ?? null}, ${lead.contactLinkedIn ?? null}, ${lead.postalAddress ?? null}
        )
        RETURNING id, created_at
      `;

      console.log('[DB] Lead insert result for', lead.company, ':', leadResult);

      const leadRow = getFirstRow<{ id: number; created_at: string }>(leadResult);
      if (!leadRow) {
        console.error('[DB] Failed to get ID for lead:', lead.company, 'result was:', leadResult);
        continue;
      }

      console.log('[DB] Created lead with ID:', leadRow.id);

      savedLeads.push({
        ...lead,
        id: leadRow.id.toString(),
        searchId,
        createdAt: leadRow.created_at,
        generated: false,
      });
      console.log('[DB] Successfully saved lead:', lead.company);
    } catch (err) {
      console.error('[DB] Failed to insert lead:', lead.company, 'Error:', err);
    }
  }

  console.log('[DB] Finished. Saved', savedLeads.length, 'out of', leads.length, 'leads');
  return { search, leads: savedLeads };
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
  await sql`
    UPDATE search_leads
    SET generated = true
    WHERE id = ${leadId}
  `;
}

// Delete a search and its leads
export async function deleteSearch(searchId: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM searches WHERE id = ${searchId}`;
}
