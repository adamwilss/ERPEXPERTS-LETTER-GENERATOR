import { getSql } from './client';

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

  // Insert search
  const searchResult = await sql`
    INSERT INTO searches (industry, employee_range, location, keywords)
    VALUES (${params.industry}, ${params.employeeRange}, ${params.location}, ${params.keywords})
    RETURNING id, created_at
  `;

  const searchRow = searchResult[0] as { id: number; created_at: string };
  const searchId = searchRow.id.toString();

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

  for (const lead of leads) {
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

    const leadRow = leadResult[0] as { id: number; created_at: string };

    savedLeads.push({
      ...lead,
      id: leadRow.id.toString(),
      searchId,
      createdAt: leadRow.created_at,
      generated: false,
    });
  }

  return { search, leads: savedLeads };
}

// Load all saved searches
export async function loadSavedSearches(): Promise<SavedSearch[]> {
  const sql = getSql();

  const result = await sql`
    SELECT id, industry, employee_range, location, keywords, created_at
    FROM searches
    ORDER BY created_at DESC
    LIMIT 50
  `;

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

  const result = await sql`
    SELECT
      id, search_id, company, website, industry, employees,
      description, erp_score, location, contact_name, contact_title,
      contact_email, contact_linkedin, postal_address, created_at, generated
    FROM search_leads
    WHERE search_id = ${searchId}
    ORDER BY erp_score DESC
  `;

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
