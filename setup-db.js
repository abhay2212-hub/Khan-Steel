/**
 * Khan Steel — Supabase Database Setup Script
 * 
 * Usage:  node setup-db.js <your-database-password>
 * 
 * This connects to your Supabase PostgreSQL instance and creates
 * all required tables, indexes, RLS policies, triggers, and seed data.
 */

import pg from 'pg';
const { Client } = pg;

const DB_PASSWORD = process.argv[2];

if (!DB_PASSWORD) {
  console.error('\n❌  Usage: node setup-db.js <your-supabase-database-password>\n');
  process.exit(1);
}

const connectionString = `postgresql://postgres.sjpassfmgdcjcqvrxevj:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`;

const SQL = `
-- ============================================================
-- Khan Steel — Supabase PostgreSQL Schema
-- ============================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title         TEXT NOT NULL,
    meta          TEXT,
    description   TEXT,
    image         TEXT,
    delay         INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Project Items
CREATE TABLE IF NOT EXISTS project_items (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT,
    quantity      INT DEFAULT 1,
    unit          TEXT DEFAULT 'pcs',
    rate          NUMERIC(12,2) DEFAULT 0,
    amount        NUMERIC(14,2) GENERATED ALWAYS AS (quantity * rate) STORED,
    image         TEXT,
    status        TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','in_progress','completed')),
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Contact Submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name          TEXT NOT NULL,
    phone         TEXT NOT NULL,
    project_type  TEXT,
    message       TEXT,
    ip_address    INET,
    user_agent    TEXT,
    status        TEXT DEFAULT 'new'
        CHECK (status IN ('new','contacted','completed')),
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    status        TEXT DEFAULT 'active'
        CHECK (status IN ('active','unsubscribed')),
    ip_address    INET,
    subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_items_project ON project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_contact_phone          ON contact_submissions(phone);
CREATE INDEX IF NOT EXISTS idx_contact_status         ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created        ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_email       ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status      ON newsletter_subscribers(status);

-- RLS
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (idempotent)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read projects"        ON projects;
  DROP POLICY IF EXISTS "Public read project_items"   ON project_items;
  DROP POLICY IF EXISTS "Public insert contacts"      ON contact_submissions;
  DROP POLICY IF EXISTS "Public insert newsletter"    ON newsletter_subscribers;
  DROP POLICY IF EXISTS "Admin full access projects"      ON projects;
  DROP POLICY IF EXISTS "Admin full access project_items" ON project_items;
  DROP POLICY IF EXISTS "Admin full access contacts"      ON contact_submissions;
  DROP POLICY IF EXISTS "Admin full access newsletter"    ON newsletter_subscribers;
END $$;

CREATE POLICY "Public read projects"       ON projects FOR SELECT USING (true);
CREATE POLICY "Public read project_items"  ON project_items FOR SELECT USING (true);
CREATE POLICY "Public insert contacts"     ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert newsletter"   ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access projects"       ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access project_items"  ON project_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access contacts"       ON contact_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access newsletter"     ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
DROP TRIGGER IF EXISTS trg_project_items_updated ON project_items;
DROP TRIGGER IF EXISTS trg_contacts_updated ON contact_submissions;

CREATE TRIGGER trg_projects_updated
    BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_project_items_updated
    BEFORE UPDATE ON project_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_contacts_updated
    BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Seed default projects (only if table is empty)
INSERT INTO projects (title, meta, description, image, delay)
SELECT * FROM (VALUES
    ('Architectural Gates',    'Varanasi Estates • 2024',   'High-integrity laser-cut entrance gates featuring specialized anti-corrosion coatings and monolithic modern design.',              './as/6.webp', 0),
    ('Luxury Steel Railings',  'Prime Residences • 2024',   'Bespoke stainless steel and glass railings engineered for maximum structural safety and minimalist architectural appeal.',       './as/7.jpg',  100),
    ('Modern Steel Windows',   'Modernist Manor • 2024',    'Ultra-slim architectural steel window frames, providing monolithic structural support and expansive panoramic views.',          './as/4.webp', 200),
    ('Safety Grills',          'High-Security Homes • 2024', 'Bespoke laser-cut safety grilles that integrate industrial-grade security with premium residential aesthetics.',              './as/5.webp', 300)
) AS seed(title, meta, description, image, delay)
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);
`;

async function main() {
  console.log('\n🔌 Connecting to Supabase PostgreSQL…');
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📦 Creating tables, indexes, policies, triggers & seed data…');
    await client.query(SQL);
    console.log('✅ All done!\n');

    // Quick verification
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('projects','project_items','contact_submissions','newsletter_subscribers')
      ORDER BY tablename;
    `);
    console.log('📋 Tables created:');
    tables.forEach(t => console.log(`   ✓ ${t.tablename}`));

    const { rows: [{ count }] } = await client.query('SELECT count(*) FROM projects');
    console.log(`\n📊 Projects in database: ${count}`);
    console.log('\n🎉 Database is ready! Run "npm run dev" to start the app.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('\n💡 Make sure you\'re using the correct database password from:');
      console.error('   Supabase Dashboard → Project Settings → Database → Database Password\n');
    }
  } finally {
    await client.end();
  }
}

main();
