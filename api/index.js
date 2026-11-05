import express from 'express';
import { createApp } from '../src/app-factory.js';
import { openDb } from '../src/db.js';
import { loadProjectEnv } from '../src/env.js';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

// Force Vercel rebuild - v3 - COMPLETE RESTRUCTURE

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
loadProjectEnv(envPath);

if (process.env.VERCEL) {
  process.env.UPLOAD_DIR = '/tmp/uploads';
  try {
    mkdirSync('/tmp/uploads', { recursive: true });
  } catch (error) {
    console.error('Failed to create /tmp/uploads:', error.message);
  }
}

let app;
let initError = null;
try {
  console.log('Starting initialization...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
  console.log('PINEDA_USER_ID:', process.env.PINEDA_USER_ID);
  console.log('PINEDA_DISCORD_ID:', process.env.PINEDA_DISCORD_ID);
  const db = openDb();
  console.log('Database opened successfully');
  app = createApp(db);
  console.log('App created successfully');
} catch (error) {
  console.error('Error initializing app:', error.message);
  console.error('Error stack:', error.stack);
  initError = error.message;
  app = null;
}

export default app;
