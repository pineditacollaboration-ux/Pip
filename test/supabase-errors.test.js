import test from 'node:test';
import assert from 'node:assert/strict';
import { createQueries } from '../src/supabase-queries.js';

function supabaseResult(result) {
  const query = {
    select() { return this; },
    update() { return this; },
    delete() { return this; },
    upsert() { return this; },
    insert() { return this; },
    eq() { return this; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return { from() { return query; } };
}

test('Supabase mutation errors propagate instead of looking successful', async () => {
  const queries = createQueries(supabaseResult({ data: null, error: new Error('write failed') }));
  await assert.rejects(queries.setMedia('avatar', 'https://example.test/avatar.png', 7), /write failed/);
});

test('Supabase count errors fail closed instead of reporting zero users', async () => {
  const queries = createQueries(supabaseResult({ count: null, error: new Error('count failed') }));
  await assert.rejects(queries.countUsers(), /count failed/);
});
