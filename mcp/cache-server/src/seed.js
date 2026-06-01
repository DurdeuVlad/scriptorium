#!/usr/bin/env node

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.CACHE_DB_PATH || join(__dirname, '..', 'cache.db');

console.log('[seed] Seeding cache-server with test data...');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function getCurrentTimestamp() {
  return new Date().toISOString();
}

const runId1 = uuidv4();
const runId2 = uuidv4();
const now = getCurrentTimestamp();

console.log('[seed] Creating test runs...');

db.prepare(`
  INSERT INTO runs (run_id, workflow, project, status, input_params, started_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  runId1,
  'brief-production',
  'test-project-1',
  'completed',
  JSON.stringify({ topic: 'AI Writing Systems', domain: 'technical' }),
  now,
  now
);

db.prepare(`
  INSERT INTO runs (run_id, workflow, project, status, input_params, started_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  runId2,
  'draft-production',
  'test-project-2',
  'paused',
  JSON.stringify({ topic: 'D&D Campaign Setting', domain: 'worldbuilding' }),
  now,
  now
);

console.log('[seed] Creating test steps...');

const step1Id = uuidv4();
const step2Id = uuidv4();
const step3Id = uuidv4();
const step4Id = uuidv4();

db.prepare(`
  INSERT INTO steps (step_id, run_id, step_name, agent, input_summary, output_summary, status, duration_ms, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  step1Id,
  runId1,
  'discovery',
  'discovery-agent',
  'Analyze project context',
  'Discovery report with 5 key findings',
  'completed',
  2500,
  now
);

db.prepare(`
  INSERT INTO steps (step_id, run_id, step_name, agent, input_summary, output_summary, status, duration_ms, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  step2Id,
  runId1,
  'write-brief',
  'brief-writer',
  'Discovery report + user requirements',
  'Brief document (1200 words)',
  'completed',
  4800,
  now
);

db.prepare(`
  INSERT INTO steps (step_id, run_id, step_name, agent, input_summary, output_summary, status, duration_ms, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  step3Id,
  runId2,
  'write-outline',
  'outline-architect',
  'Brief document',
  'Outline with 8 sections',
  'completed',
  3200,
  now
);

db.prepare(`
  INSERT INTO steps (step_id, run_id, step_name, agent, input_summary, output_summary, status, duration_ms, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  step4Id,
  runId2,
  'draft-section',
  'section-drafter',
  'Outline section 1',
  'Draft section 1 (800 words)',
  'failed',
  1500,
  now
);

console.log('[seed] Creating test artifacts...');

const artifact1Id = uuidv4();
const artifact2Id = uuidv4();
const artifact3Id = uuidv4();

db.prepare(`
  INSERT INTO artifacts (artifact_id, run_id, step_id, artifact_type, content, stored_path, metadata, size_bytes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  artifact1Id,
  runId1,
  step1Id,
  'structured-data',
  JSON.stringify({ findings: ['Finding 1', 'Finding 2', 'Finding 3'], confidence: 0.85 }),
  null,
  JSON.stringify({ format: 'discovery-report' }),
  150,
  now
);

db.prepare(`
  INSERT INTO artifacts (artifact_id, run_id, step_id, artifact_type, content, stored_path, metadata, size_bytes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  artifact2Id,
  runId1,
  step2Id,
  'draft',
  '# AI Writing Systems\n\nThis is a test brief document...',
  null,
  JSON.stringify({ word_count: 1200, format: 'markdown' }),
  1200,
  now
);

db.prepare(`
  INSERT INTO artifacts (artifact_id, run_id, step_id, artifact_type, content, stored_path, metadata, size_bytes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  artifact3Id,
  runId2,
  step3Id,
  'intermediate-draft',
  '# Campaign Setting Outline\n\n## Section 1: Geography\n## Section 2: History\n...',
  null,
  JSON.stringify({ section_count: 8, format: 'markdown' }),
  800,
  now
);

console.log('[seed] Creating test blocker...');

const blockerId = uuidv4();

db.prepare(`
  INSERT INTO blockers (blocker_id, run_id, step_id, blocker_type, description, resolution_required, severity, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  blockerId,
  runId2,
  step4Id,
  'canon-conflict',
  'Section draft conflicts with established canon: character name mismatch',
  'User must clarify canonical character name or approve override',
  'blocking',
  now
);

console.log('[seed] Creating test resume point...');

const resumePointId = uuidv4();

db.prepare(`
  INSERT INTO resume_points (resume_point_id, run_id, step_index, checkpoint_name, state_snapshot, artifact_ids, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  resumePointId,
  runId2,
  3,
  'post-outline',
  JSON.stringify({ current_section: 1, sections_total: 8, outline_approved: true }),
  JSON.stringify([artifact3Id]),
  now
);

console.log('[seed] Creating test review output...');

const reviewId = uuidv4();

db.prepare(`
  INSERT INTO review_outputs (review_id, run_id, step_id, artifact_id, reviewer_agent, rubric_id, verdict, findings, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  reviewId,
  runId1,
  step2Id,
  artifact2Id,
  'qa-reader',
  'G-RUB-001',
  'pass',
  JSON.stringify([
    { category: 'clarity', severity: 'minor', description: 'One ambiguous pronoun reference' },
    { category: 'structure', severity: 'none', description: 'Well-organized sections' }
  ]),
  now
);

console.log('[seed] Creating test merge report...');

const mergeId = uuidv4();

db.prepare(`
  INSERT INTO merge_reports (merge_id, run_id, step_id, source_artifact_ids, output_artifact_id, merge_strategy, conflicts_detected, conflict_resolutions, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  mergeId,
  runId1,
  step2Id,
  JSON.stringify([artifact1Id]),
  artifact2Id,
  'sequential',
  0,
  null,
  now
);

db.close();

console.log('[seed] Seed data created successfully');
console.log(`[seed] Created 2 runs, 4 steps, 3 artifacts, 1 blocker, 1 resume point, 1 review, 1 merge report`);
console.log(`[seed] Run IDs: ${runId1}, ${runId2}`);
