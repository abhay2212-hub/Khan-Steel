/**
 * Khan Steel — Supabase Setup via REST API
 * Uses the Supabase pg-meta API to execute SQL directly
 */

const SUPABASE_URL = 'https://sjpassfmgdcjcqvrxevj.supabase.co';
const DB_PASSWORD = process.argv[2];

if (!DB_PASSWORD) {
  console.error('\n❌  Usage: node setup-db-rest.js <your-database-password>\n');
  process.exit(1);
}

// SQL statements to execute individually
const statements = [
  // 1. Projects table
  `CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    meta TEXT,
    description TEXT,
    image TEXT,
    delay INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,

  // 2. Project Items table
  `CREATE TABLE IF NOT EXISTS project_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    rate NUMERIC(12,2) DEFAULT 0,
    amount NUMERIC(14,2) GENERATED ALWAYS AS (quantity * rate) STORED,
    image TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,

  // 3. Contact Submissions table
  `CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    project_type TEXT,
    message TEXT,
    ip_address INET,
    user_agent TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,

  // 4. Newsletter Subscribers table
  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','unsubscribed')),
    ip_address INET,
    subscribed_at TIMESTAMPTZ DEFAULT now()
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_project_items_project ON project_items(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_contact_phone ON contact_submissions(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status)`,
  `CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)`,
  `CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status)`,

  // RLS
  `ALTER TABLE projects ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE project_items ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY`,

  // Drop existing policies (idempotent)
  `DROP POLICY IF EXISTS "Public read projects" ON projects`,
  `DROP POLICY IF EXISTS "Public read project_items" ON project_items`,
  `DROP POLICY IF EXISTS "Public insert contacts" ON contact_submissions`,
  `DROP POLICY IF EXISTS "Public insert newsletter" ON newsletter_subscribers`,
  `DROP POLICY IF EXISTS "Admin full access projects" ON projects`,
  `DROP POLICY IF EXISTS "Admin full access project_items" ON project_items`,
  `DROP POLICY IF EXISTS "Admin full access contacts" ON contact_submissions`,
  `DROP POLICY IF EXISTS "Admin full access newsletter" ON newsletter_subscribers`,

  // Create policies
  `CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true)`,
  `CREATE POLICY "Public read project_items" ON project_items FOR SELECT USING (true)`,
  `CREATE POLICY "Public insert contacts" ON contact_submissions FOR INSERT WITH CHECK (true)`,
  `CREATE POLICY "Public insert newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true)`,
  `CREATE POLICY "Admin full access projects" ON projects FOR ALL USING (true) WITH CHECK (true)`,
  `CREATE POLICY "Admin full access project_items" ON project_items FOR ALL USING (true) WITH CHECK (true)`,
  `CREATE POLICY "Admin full access contacts" ON contact_submissions FOR ALL USING (true) WITH CHECK (true)`,
  `CREATE POLICY "Admin full access newsletter" ON newsletter_subscribers FOR ALL USING (true) WITH CHECK (true)`,

  // Trigger function
  `CREATE OR REPLACE FUNCTION update_modified_column()
   RETURNS TRIGGER AS $fn$
   BEGIN
     NEW.updated_at = now();
     RETURN NEW;
   END;
   $fn$ LANGUAGE plpgsql`,

  // Triggers
  `DROP TRIGGER IF EXISTS trg_projects_updated ON projects`,
  `DROP TRIGGER IF EXISTS trg_project_items_updated ON project_items`,
  `DROP TRIGGER IF EXISTS trg_contacts_updated ON contact_submissions`,
  `CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column()`,
  `CREATE TRIGGER trg_project_items_updated BEFORE UPDATE ON project_items FOR EACH ROW EXECUTE FUNCTION update_modified_column()`,
  `CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contact_submissions FOR EACH ROW EXECUTE FUNCTION update_modified_column()`,
];

// Seed data as separate inserts via PostgREST
const seedProjects = [
  { title: 'Architectural Gates', meta: 'Varanasi Estates • 2024', description: 'High-integrity laser-cut entrance gates featuring specialized anti-corrosion coatings and monolithic modern design.', image: './as/6.webp', delay: 0 },
  { title: 'Luxury Steel Railings', meta: 'Prime Residences • 2024', description: 'Bespoke stainless steel and glass railings engineered for maximum structural safety and minimalist architectural appeal.', image: './as/7.jpg', delay: 100 },
  { title: 'Modern Steel Windows', meta: 'Modernist Manor • 2024', description: 'Ultra-slim architectural steel window frames, providing monolithic structural support and expansive panoramic views.', image: './as/4.webp', delay: 200 },
  { title: 'Safety Grills', meta: 'High-Security Homes • 2024', description: 'Bespoke laser-cut safety grilles that integrate industrial-grade security with premium residential aesthetics.', image: './as/5.webp', delay: 300 },
];

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-supabase-db-password': DB_PASSWORD,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  
  return await res.json();
}

async function main() {
  console.log('\n🔌 Connecting to Supabase via REST API…\n');

  // Execute DDL statements
  let success = 0;
  let failed = 0;

  for (const sql of statements) {
    try {
      await runSQL(sql);
      const label = sql.substring(0, 60).replace(/\n/g, ' ').trim();
      console.log(`   ✅ ${label}…`);
      success++;
    } catch (err) {
      const label = sql.substring(0, 60).replace(/\n/g, ' ').trim();
      console.log(`   ❌ ${label}… — ${err.message.substring(0, 100)}`);
      failed++;
    }
  }

  console.log(`\n📊 DDL: ${success} succeeded, ${failed} failed\n`);

  // Seed projects via PostgREST
  console.log('🌱 Seeding default projects…');
  
  // Check if projects already exist
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`, {
    headers: {
      'apikey': 'sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR',
      'Authorization': 'Bearer sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR',
    }
  });

  if (checkRes.ok) {
    const existing = await checkRes.json();
    if (existing.length > 0) {
      console.log('   ⏭️  Projects already exist, skipping seed.\n');
    } else {
      // Insert seed data
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR',
          'Authorization': 'Bearer sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(seedProjects),
      });

      if (insertRes.ok) {
        const inserted = await insertRes.json();
        console.log(`   ✅ Seeded ${inserted.length} projects\n`);
      } else {
        const errText = await insertRes.text();
        console.log(`   ❌ Seed failed: ${errText}\n`);
      }
    }
  } else {
    console.log('   ❌ Could not check existing projects. Tables may not have been created.\n');
  }

  // Final verification
  console.log('🔍 Verifying tables…');
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,title&limit=10`, {
    headers: {
      'apikey': 'sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR',
      'Authorization': 'Bearer sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR',
    }
  });

  if (verifyRes.ok) {
    const projects = await verifyRes.json();
    console.log(`   ✅ Projects table working — ${projects.length} rows found`);
    projects.forEach(p => console.log(`      • ${p.title}`));
  } else {
    console.log('   ❌ Verification failed:', await verifyRes.text());
  }

  console.log('\n🎉 Setup complete! Run "npm run dev" to start.\n');
}

main().catch(err => console.error('Fatal:', err));
