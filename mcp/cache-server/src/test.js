#!/usr/bin/env node

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.CACHE_DB_PATH || join(__dirname, '..', 'cache.db');

console.log('[test] Running cache-server tests...\n');

const db = new Database(DB_PATH);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

test('Database file exists', () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  if (tables.length === 0) throw new Error('No tables found');
});

test('Runs table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM runs').get();
  if (count.count === 0) throw new Error('No runs found');
});

test('Steps table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM steps').get();
  if (count.count === 0) throw new Error('No steps found');
});

test('Artifacts table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM artifacts').get();
  if (count.count === 0) throw new Error('No artifacts found');
});

test('Blockers table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM blockers').get();
  if (count.count === 0) throw new Error('No blockers found');
});

test('Resume points table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM resume_points').get();
  if (count.count === 0) throw new Error('No resume points found');
});

test('Review outputs table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM review_outputs').get();
  if (count.count === 0) throw new Error('No review outputs found');
});

test('Merge reports table has records', () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM merge_reports').get();
  if (count.count === 0) throw new Error('No merge reports found');
});

test('Foreign key constraints work', () => {
  const steps = db.prepare('SELECT * FROM steps WHERE run_id NOT IN (SELECT run_id FROM runs)').all();
  if (steps.length > 0) throw new Error('Orphaned steps found');
});

test('Run status values are valid', () => {
  const runs = db.prepare("SELECT * FROM runs WHERE status NOT IN ('running', 'completed', 'failed', 'cancelled', 'paused')").all();
  if (runs.length > 0) throw new Error('Invalid run status found');
});

test('Step status values are valid', () => {
  const steps = db.prepare("SELECT * FROM steps WHERE status NOT IN ('completed', 'failed', 'skipped')").all();
  if (steps.length > 0) throw new Error('Invalid step status found');
});

test('Blocker severity values are valid', () => {
  const blockers = db.prepare("SELECT * FROM blockers WHERE severity NOT IN ('blocking', 'degraded')").all();
  if (blockers.length > 0) throw new Error('Invalid blocker severity found');
});

test('Review verdict values are valid', () => {
  const reviews = db.prepare("SELECT * FROM review_outputs WHERE verdict NOT IN ('pass', 'conditional-pass', 'fail')").all();
  if (reviews.length > 0) throw new Error('Invalid review verdict found');
});

test('Timestamps are ISO 8601 format', () => {
  const runs = db.prepare('SELECT started_at FROM runs LIMIT 1').get();
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!iso8601Regex.test(runs.started_at)) throw new Error('Invalid timestamp format');
});

test('JSON fields can be parsed', () => {
  const run = db.prepare('SELECT input_params FROM runs WHERE input_params IS NOT NULL LIMIT 1').get();
  JSON.parse(run.input_params);
});

test('Indexes exist', () => {
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'").all();
  if (indexes.length < 10) throw new Error(`Expected at least 10 indexes, found ${indexes.length}`);
});

test('WAL mode is enabled', () => {
  const journalMode = db.pragma('journal_mode', { simple: true });
  if (journalMode !== 'wal') throw new Error(`Expected WAL mode, got ${journalMode}`);
});

test('Foreign keys are enabled', () => {
  const foreignKeys = db.pragma('foreign_keys', { simple: true });
  if (foreignKeys !== 1) throw new Error('Foreign keys not enabled');
});

test('Paused run has blocking blocker', () => {
  const pausedRuns = db.prepare("SELECT run_id FROM runs WHERE status = 'paused'").all();
  for (const run of pausedRuns) {
    const blocker = db.prepare("SELECT * FROM blockers WHERE run_id = ? AND severity = 'blocking'").get(run.run_id);
    if (!blocker) throw new Error(`Paused run ${run.run_id} has no blocking blocker`);
  }
});

test('Resume point references valid run', () => {
  const resumePoints = db.prepare('SELECT run_id FROM resume_points').all();
  for (const rp of resumePoints) {
    const run = db.prepare('SELECT * FROM runs WHERE run_id = ?').get(rp.run_id);
    if (!run) throw new Error(`Resume point references non-existent run ${rp.run_id}`);
  }
});

db.close();

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
