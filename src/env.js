import { existsSync, readFileSync } from 'node:fs';

export function loadProjectEnv(envPath) {
  if (!envPath || !existsSync(envPath)) return false;

  const raw = readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    const clean = value.replace(/^['"]|['"]$/g, '');
    if (!key) continue;

    const oldValue = process.env[key];
    if (oldValue === undefined || oldValue === '') {
      process.env[key] = clean;
      continue;
    }

    process.env[key] = clean;
  }

  return true;
}
