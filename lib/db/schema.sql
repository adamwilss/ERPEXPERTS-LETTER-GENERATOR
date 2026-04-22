-- Vercel/Neon Postgres Schema for Letter History

-- Companies table (normalized)
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  employee_count TEXT,
  erp_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Letter packs
CREATE TABLE IF NOT EXISTS packs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  search_id INTEGER REFERENCES searches(id) ON DELETE SET NULL,
  lead_id INTEGER REFERENCES search_leads(id) ON DELETE SET NULL,
  recipient_name TEXT,
  contact_title TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up sequences
CREATE TABLE IF NOT EXISTS sequences (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER REFERENCES packs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Outcomes/responses
CREATE TABLE IF NOT EXISTS outcomes (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER REFERENCES packs(id) ON DELETE CASCADE,
  sent_date TIMESTAMP,
  response_date TIMESTAMP,
  response_type TEXT,
  meeting_booked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Searches table (for saving Apollo search results)
CREATE TABLE IF NOT EXISTS searches (
  id SERIAL PRIMARY KEY,
  industry TEXT NOT NULL,
  employee_range TEXT NOT NULL,
  location TEXT NOT NULL,
  keywords TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search leads table (Apollo results)
-- All fields nullable except id and search_id to handle incomplete Apollo data
CREATE TABLE IF NOT EXISTS search_leads (
  id SERIAL PRIMARY KEY,
  search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  company TEXT,
  website TEXT,
  industry TEXT,
  employees TEXT,
  description TEXT,
  erp_score INTEGER DEFAULT 0,
  data_score INTEGER DEFAULT 0,
  rank INTEGER,
  rationale TEXT,
  org_id TEXT,
  founded_year INTEGER,
  annual_revenue TEXT,
  tech_stack TEXT,
  phone TEXT,
  linkedin_url TEXT,
  location TEXT,
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_linkedin TEXT,
  postal_address TEXT,
  recipient_name TEXT,
  generated BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_packs_company ON packs(company_id);
CREATE INDEX IF NOT EXISTS idx_packs_search ON packs(search_id);
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);
CREATE INDEX IF NOT EXISTS idx_packs_created ON packs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sequences_pack ON sequences(pack_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_pack ON outcomes(pack_id);
CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_leads_search ON search_leads(search_id);
CREATE INDEX IF NOT EXISTS idx_search_leads_generated ON search_leads(generated);
CREATE INDEX IF NOT EXISTS idx_search_leads_status ON search_leads(status);

-- Migration: add missing columns for existing deployments
-- Run these manually in Neon SQL Editor if tables already exist:
--
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS data_score INTEGER DEFAULT 0;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS rank INTEGER;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS rationale TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS org_id TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS founded_year INTEGER;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS annual_revenue TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS tech_stack TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS recipient_name TEXT;
-- ALTER TABLE search_leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
-- ALTER TABLE packs ADD COLUMN IF NOT EXISTS search_id INTEGER REFERENCES searches(id) ON DELETE SET NULL;
-- ALTER TABLE packs ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES search_leads(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_packs_search ON packs(search_id);
-- CREATE INDEX IF NOT EXISTS idx_search_leads_status ON search_leads(status);
