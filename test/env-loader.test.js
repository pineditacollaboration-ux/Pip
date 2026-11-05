import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadProjectEnv } from '../src/env.js';

test('la .env del proyecto debe sobrescribir las variables ya presentes en el entorno', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pip-env-'));
  const envPath = join(dir, '.env');
  writeFileSync(envPath, 'SUPABASE_URL=https://project.example\nPINEDA_USER_ID=42\n');

  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.PINEDA_USER_ID = '1';

  try {
    loadProjectEnv(envPath);
    assert.equal(process.env.SUPABASE_URL, 'https://project.example');
    assert.equal(process.env.PINEDA_USER_ID, '42');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
