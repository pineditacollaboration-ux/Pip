import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './env.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
loadProjectEnv(envPath);

export function openDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY) en .env');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
