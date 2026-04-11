-- ============================================================
-- Khan Steel — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- ============================================================

-- 1. Projects Table (migrated from MongoDB "projects" collection)
CREATE TABLE IF NOT EXISTS projects (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title         TEXT NOT NULL,
    meta          TEXT,                              -- e.g. "Varanasi Estates • 2024"
    description   TEXT,
    image         TEXT,                              -- URL / path to thumbnail
    delay         INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Project Items — items that belong to a project (line‑item details)
CREATE TABLE IF NOT EXISTS project_items (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,                      -- item name / product
    description   TEXT,
    quantity      INT DEFAULT 1,
    unit          TEXT DEFAULT 'pcs',                 -- pcs, kg, meters, etc.
    rate          NUMERIC(12,2) DEFAULT 0,            -- price per unit
    amount        NUMERIC(14,2) GENERATED ALWAYS AS (quantity * rate) STORED,
    image         TEXT,                               -- optional image URL
    status        TEXT DEFAULT 'pending'              -- pending | in_progress | completed
        CHECK (status IN ('pending','in_progress','completed')),
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Contact Submissions (migrated from MySQL schema)
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

-- 4. Newsletter Subscribers (migrated from MySQL schema)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    status        TEXT DEFAULT 'active'
        CHECK (status IN ('active','unsubscribed')),
    ip_address    INET,
    subscribed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes for fast lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_project_items_project ON project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_contact_phone          ON contact_submissions(phone);
CREATE INDEX IF NOT EXISTS idx_contact_status         ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created        ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_email       ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status      ON newsletter_subscribers(status);

-- ============================================================
-- Row Level Security (RLS) — Public read, authenticated write
-- Enable if you want to protect writes via Supabase Auth later
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) reads on projects & project_items
CREATE POLICY "Public read projects"       ON projects FOR SELECT USING (true);
CREATE POLICY "Public read project_items"  ON project_items FOR SELECT USING (true);

-- Allow anon to insert contact submissions (public contact form)
CREATE POLICY "Public insert contacts"     ON contact_submissions FOR INSERT WITH CHECK (true);

-- Allow anon to subscribe to newsletter
CREATE POLICY "Public insert newsletter"   ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Allow full access for authenticated / service_role (admin backend)
CREATE POLICY "Admin full access projects"       ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access project_items"  ON project_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access contacts"       ON contact_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access newsletter"     ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Auto‑update "updated_at" trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_project_items_updated
    BEFORE UPDATE ON project_items
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_contacts_updated
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- Seed the 4 default projects
-- ============================================================
INSERT INTO projects (id, title, meta, description, image, delay) VALUES
    (gen_random_uuid(), 'Architectural Gates',    'Varanasi Estates • 2024',  'High-integrity laser-cut entrance gates featuring specialized anti-corrosion coatings and monolithic modern design.',                    './as/6.webp', 0),
    (gen_random_uuid(), 'Luxury Steel Railings',  'Prime Residences • 2024',  'Bespoke stainless steel and glass railings engineered for maximum structural safety and minimalist architectural appeal.',             './as/7.jpg',  100),
    (gen_random_uuid(), 'Modern Steel Windows',   'Modernist Manor • 2024',  'Ultra-slim architectural steel window frames, providing monolithic structural support and expansive panoramic views.',                './as/4.webp', 200),
    (gen_random_uuid(), 'Safety Grills',          'High-Security Homes • 2024','Bespoke laser-cut safety grilles that integrate industrial-grade security with premium residential aesthetics.',                    './as/5.webp', 300)
ON CONFLICT DO NOTHING;
