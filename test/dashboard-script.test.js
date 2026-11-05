import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/dashboard.html', import.meta.url), 'utf8');

test('los scripts inline del dashboard compilan', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((source) => source.trim());
  assert.ok(scripts.length, 'se encontró al menos un script inline');
  for (const source of scripts) assert.doesNotThrow(() => new Function(source));
});

test('los interruptores de ajustes declaran una etiqueta accesible', () => {
  assert.match(html, /function toggle\(get, set, label = 'Ajuste'\)/);
  assert.match(html, /'aria-label': label/);
});

test('el panel Discord explica fallos de presencia y programa actualización ligera', () => {
  assert.match(html, /configuration_missing:/);
  assert.match(html, /bot_disconnected:/);
  assert.match(html, /not_in_server:/);
  assert.match(html, /api\/discord\/presence/);
  assert.match(html, /if \(!document.hidden\) syncDiscordPresence\(false\)/);
});
