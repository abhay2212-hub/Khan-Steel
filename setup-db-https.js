/**
 * Khan Steel — Supabase Setup via supabase-js client
 * Works over HTTPS (port 443) - no direct PostgreSQL needed
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sjpassfmgdcjcqvrxevj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sko6FV6QwUuqIulyl93P_A_KJt9iysR';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const seedProjects = [
  { title: 'Architectural Gates', meta: 'Varanasi Estates • 2024', description: 'High-integrity laser-cut entrance gates featuring specialized anti-corrosion coatings and monolithic modern design.', image: './as/6.webp', delay: 0 },
  { title: 'Luxury Steel Railings', meta: 'Prime Residences • 2024', description: 'Bespoke stainless steel and glass railings engineered for maximum structural safety and minimalist architectural appeal.', image: './as/7.jpg', delay: 100 },
  { title: 'Modern Steel Windows', meta: 'Modernist Manor • 2024', description: 'Ultra-slim architectural steel window frames, providing monolithic structural support and expansive panoramic views.', image: './as/4.webp', delay: 200 },
  { title: 'Safety Grills', meta: 'High-Security Homes • 2024', description: 'Bespoke laser-cut safety grilles that integrate industrial-grade security with premium residential aesthetics.', image: './as/5.webp', delay: 300 },
];

async function main() {
  console.log('\n🔍 Checking if tables exist via Supabase REST API…\n');

  // Test if projects table exists
  const { data, error } = await supabase.from('projects').select('id').limit(1);
  
  if (error && error.code === 'PGRST205') {
    console.log('❌ Tables do not exist yet.');
    console.log('\n⚠️  Your network blocks direct PostgreSQL connections (ports 5432/6543).');
    console.log('   You need to create tables via the Supabase Dashboard SQL Editor.\n');
    console.log('   📋 Steps:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/sjpassfmgdcjcqvrxevj/sql/new');
    console.log('   2. Copy the contents of supabase_schema.sql from your project folder');
    console.log('   3. Paste into the editor and click "Run"\n');
    console.log('   After that, run this script again to seed default data.\n');
    process.exit(1);
  } 
  
  if (error) {
    console.log('❌ Unexpected error:', error.message);
    process.exit(1);
  }

  console.log('✅ Tables exist!\n');

  // Check if projects already seeded
  if (data && data.length > 0) {
    console.log('⏭️  Projects already have data, skipping seed.\n');
  } else {
    console.log('🌱 Seeding default projects…');
    const { data: inserted, error: insertErr } = await supabase
      .from('projects')
      .insert(seedProjects)
      .select();
    
    if (insertErr) {
      console.log('❌ Seed failed:', insertErr.message);
    } else {
      console.log(`✅ Seeded ${inserted.length} projects:`);
      inserted.forEach(p => console.log(`   • ${p.title}`));
    }
  }

  // Create storage bucket
  console.log('\n📦 Setting up storage bucket…');
  const { error: bucketErr } = await supabase.storage.createBucket('project-images', {
    public: true,
    fileSizeLimit: 5242880
  });
  
  if (bucketErr && bucketErr.message.includes('already exists')) {
    console.log('   ⏭️  Bucket "project-images" already exists');
  } else if (bucketErr) {
    console.log('   ⚠️  Bucket creation:', bucketErr.message);
  } else {
    console.log('   ✅ Bucket "project-images" created');
  }

  // Final verification
  console.log('\n🔍 Final verification…');
  const { data: allProjects } = await supabase.from('projects').select('id,title');
  const { data: allItems } = await supabase.from('project_items').select('id').limit(1);
  
  console.log(`   ✅ projects table — ${allProjects?.length || 0} rows`);
  console.log(`   ✅ project_items table — accessible`);
  
  console.log('\n🎉 Database is ready! Run "npm run dev" to start the app.\n');
}

main().catch(err => console.error('Fatal:', err.message));
