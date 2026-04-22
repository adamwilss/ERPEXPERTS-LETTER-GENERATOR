-- Vercel/Neon Postgres Schema for Letter History
-- Run this in your Vercel Dashboard SQL Editor after connecting Neon

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
  UNIQUE(name, COALESCE(website, ''))
);

-- Letter packs
CREATE TABLE IF NOT EXISTS packs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_packs_company ON packs(company_id);
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);
CREATE INDEX IF NOT EXISTS idx_packs_created ON packs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sequences_pack ON sequences(pack_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_pack ON outcomes(pack_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_packs_updated_at ON packs;
CREATE TRIGGER update_packs_updated_at
  BEFORE UPDATE ON packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outcomes_updated_at ON outcomes;
CREATE TRIGGER update_outcomes_updated_at
  BEFORE UPDATE ON outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
