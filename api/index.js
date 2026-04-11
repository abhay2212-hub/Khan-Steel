import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    config: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_ANON_KEY
    }
  });
});

// ── Supabase client ──────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠  SUPABASE_URL or SUPABASE_ANON_KEY is missing from env');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ── Ensure storage bucket exists ─────────────────────────────
let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  try {
    const { data } = await supabase.storage.getBucket('project-images');
    if (!data) {
      await supabase.storage.createBucket('project-images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
    }
    bucketReady = true;
  } catch {
    try {
      await supabase.storage.createBucket('project-images', {
        public: true,
        fileSizeLimit: 5242880
      });
      bucketReady = true;
    } catch (e) {
      console.warn('Bucket may already exist:', e.message);
      bucketReady = true;
    }
  }
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  IMAGE UPLOAD                                            ║
// ╚═══════════════════════════════════════════════════════════╝

app.post('/api/upload', async (req, res) => {
  try {
    const { base64, filename, contentType } = req.body;
    
    if (!base64 || !filename) {
      return res.status(400).json({ error: 'base64 and filename required' });
    }

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing on server' });
    }

    // Try Supabase Storage first
    try {
      await ensureBucket();
      const buffer = Buffer.from(base64, 'base64');
      const ext = filename.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(uniqueName, buffer, {
          contentType: contentType || 'image/jpeg',
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('project-images')
          .getPublicUrl(uniqueName);
        return res.json({ url: urlData.publicUrl });
      }
      console.warn('Supabase Storage error (using fallback):', uploadError.message);
    } catch (storageErr) {
      console.warn('Supabase Storage unavailable (using fallback):', storageErr.message);
    }

    // Fallback: use data URL (stored in DB) - Note: Large strings might hit DB limits
    const mimeType = contentType || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Check if dataUrl is too large for database (Postgres TEXT limit is 1GB, so we are likely okay, 
    // but the payload itself shouldn't exceed Vercel's limit which we checked already)
    res.json({ url: dataUrl });
  } catch (error) {
    console.error('Final upload handler error:', error);
    res.status(500).json({ error: `Server error: ${error.message || 'Unknown'}` });
  }
});

// ╔═══════════════════════════════════════════════════════════╗
// ║  PROJECTS CRUD                                           ║
// ╚═══════════════════════════════════════════════════════════╝

app.get('/api/projects', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, meta, description, image, delay } = req.body;
    const { data, error } = await supabase
      .from('projects')
      .insert([{ title, meta, description, image, delay: delay || 0 }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ╔═══════════════════════════════════════════════════════════╗
// ║  PROJECT ITEMS CRUD                                      ║
// ╚═══════════════════════════════════════════════════════════╝

app.get('/api/projects/:projectId/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('project_items')
      .select('*')
      .eq('project_id', req.params.projectId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/items', async (req, res) => {
  try {
    const { name, description, quantity, unit, rate, image, status, sort_order } = req.body;
    const { data, error } = await supabase
      .from('project_items')
      .insert([{
        project_id: req.params.projectId,
        name,
        description: description || null,
        quantity: quantity || 1,
        unit: unit || 'pcs',
        rate: rate || 0,
        image: image || null,
        status: status || 'pending',
        sort_order: sort_order || 0
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectId/items/:itemId', async (req, res) => {
  try {
    const { name, description, quantity, unit, rate, image, status, sort_order } = req.body;
    const { data, error } = await supabase
      .from('project_items')
      .update({ name, description, quantity, unit, rate, image, status, sort_order })
      .eq('id', req.params.itemId)
      .eq('project_id', req.params.projectId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:projectId/items/:itemId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', req.params.itemId)
      .eq('project_id', req.params.projectId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ╔═══════════════════════════════════════════════════════════╗
// ║  CONTACT SUBMISSIONS                                     ║
// ╚═══════════════════════════════════════════════════════════╝

app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, project_type, message } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{ name, phone, project_type, message, ip_address, user_agent }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`⚡ Express API running on http://localhost:${PORT}`);
  });
}

// Vercel serverless function export
export default app;
