import express from 'express';
import { createApp } from '../src/app-factory.js';
import { openDb } from '../src/db.js';
import { loadProjectEnv } from '../src/env.js';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

// Cargar .env solo si existe (local development)
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
loadProjectEnv(envPath);

// Use /tmp for uploads in Vercel (only writable directory)
if (process.env.VERCEL) {
  process.env.UPLOAD_DIR = '/tmp/uploads';
  // Create the directory if it doesn't exist
  try {
    mkdirSync('/tmp/uploads', { recursive: true });
  } catch (error) {
    console.error('Failed to create /tmp/uploads:', error.message);
  }
}

let app;
let initError = null;
try {
  app = createApp(openDb());
} catch (error) {
  console.error('Error initializing app:', error.message);
  console.error('Error stack:', error.stack);
  initError = error.message;
  app = null;
}

export default function handler(req, res) {
  if (!app) {
    res.status(500).json({
      error: 'V3-CODE-DEPLOYED',
      message: initError || 'Unknown error',
      debug: {
        hasPinedaUserId: !!process.env.PINEDA_USER_ID,
        hasPinedaDiscordId: !!process.env.PINEDA_DISCORD_ID,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        hasPublicUrl: !!process.env.PUBLIC_URL,
        hasPipSecret: !!process.env.PIP_SECRET,
        uploadDir: process.env.UPLOAD_DIR
      }
    });
    return;
  }
  app(req, res);
}
