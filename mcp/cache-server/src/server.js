#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.CACHE_DB_PATH || join(__dirname, '..', 'cache.db');
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || join(__dirname, '..', '..', '..', 'artifacts');

let db;

function initDatabase() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  const schemaPath = join(__dirname, '..', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  
  console.error(`[cache-server] Database initialized at ${DB_PATH}`);
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function ensureArtifactsDir(runId) {
  const runDir = join(ARTIFACTS_DIR, runId);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }
  return runDir;
}

const server = new Server(
  {
    name: 'cache-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_run',
        description: 'Initialize a new run record. Returns run_id and started_at timestamp.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow: {
              type: 'string',
              description: 'Name of the workflow being executed',
            },
            input_params: {
              type: 'object',
              description: 'Parameters passed to the workflow',
            },
            project: {
              type: 'string',
              description: 'Project identifier (optional)',
            },
          },
          required: ['workflow'],
        },
      },
      {
        name: 'save_step',
        description: 'Record a completed step within a run. Returns step_id.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID this step belongs to',
            },
            step_name: {
              type: 'string',
              description: 'Name of the step',
            },
            agent: {
              type: 'string',
              description: 'Agent that executed this step',
            },
            input_summary: {
              type: 'string',
              description: 'Brief description of step input',
            },
            output_summary: {
              type: 'string',
              description: 'Brief description of what was produced',
            },
            status: {
              type: 'string',
              enum: ['completed', 'failed', 'skipped'],
              description: 'Step execution status',
            },
            duration_ms: {
              type: 'number',
              description: 'Step duration in milliseconds (optional)',
            },
          },
          required: ['run_id', 'step_name', 'agent', 'status'],
        },
      },
      {
        name: 'save_artifact',
        description: 'Store an artifact produced during a run. Returns artifact_id and stored_path.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID this artifact belongs to',
            },
            step_id: {
              type: 'string',
              description: 'Step ID that produced this artifact',
            },
            artifact_type: {
              type: 'string',
              description: 'Type of artifact: draft, revision, qa-report, merge-output, intermediate-draft, final-output, structured-data',
            },
            content: {
              type: 'string',
              description: 'Full artifact content',
            },
            metadata: {
              type: 'object',
              description: 'Type-specific metadata (optional)',
            },
          },
          required: ['run_id', 'step_id', 'artifact_type', 'content'],
        },
      },
      {
        name: 'save_blocker',
        description: 'Record a blocker that has halted or degraded a step. Returns blocker_id.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID where blocker occurred',
            },
            step_id: {
              type: 'string',
              description: 'Step ID where blocker occurred',
            },
            blocker_type: {
              type: 'string',
              description: 'Type of blocker: missing-input, canon-conflict, qa-fail, ambiguous-instruction, external-dependency',
            },
            description: {
              type: 'string',
              description: 'What is blocking, specifically',
            },
            resolution_required: {
              type: 'string',
              description: 'What must happen to unblock',
            },
            severity: {
              type: 'string',
              enum: ['blocking', 'degraded'],
              description: 'Severity level',
            },
          },
          required: ['run_id', 'step_id', 'blocker_type', 'description', 'resolution_required', 'severity'],
        },
      },
      {
        name: 'fetch_run_context',
        description: 'Retrieve structured context about a run for resuming or reviewing. Returns run record, steps, artifacts metadata, and blockers.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID to fetch context for',
            },
            include_artifacts: {
              type: 'boolean',
              description: 'Include full artifact content (default: false, returns metadata only)',
            },
          },
          required: ['run_id'],
        },
      },
      {
        name: 'fetch_resume_point',
        description: 'Retrieve the most recent resume point for a run. Returns resume point or null if none exists.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID to fetch resume point for',
            },
          },
          required: ['run_id'],
        },
      },
      {
        name: 'list_run_artifacts',
        description: 'List artifacts produced by a run, with optional filters. Returns artifact metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID to list artifacts for',
            },
            artifact_type: {
              type: 'string',
              description: 'Filter to specific artifact type (optional)',
            },
            step_id: {
              type: 'string',
              description: 'Filter to specific step output (optional)',
            },
          },
          required: ['run_id'],
        },
      },
      {
        name: 'close_run',
        description: 'Mark a run as completed, failed, or cancelled. Returns success status and closed_at timestamp.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID to close',
            },
            status: {
              type: 'string',
              enum: ['completed', 'failed', 'cancelled'],
              description: 'Final run status',
            },
            summary: {
              type: 'string',
              description: 'Brief summary of run outcome (optional)',
            },
          },
          required: ['run_id', 'status'],
        },
      },
      {
        name: 'save_resume_point',
        description: 'Create a checkpoint for resuming an interrupted run. Returns resume_point_id.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID to create resume point for',
            },
            step_index: {
              type: 'number',
              description: 'Step index to resume from',
            },
            checkpoint_name: {
              type: 'string',
              description: 'Name of this checkpoint (optional)',
            },
            state_snapshot: {
              type: 'object',
              description: 'State snapshot needed to resume',
            },
            artifact_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Artifact IDs completed up to this point',
            },
          },
          required: ['run_id', 'step_index', 'state_snapshot'],
        },
      },
      {
        name: 'save_review_output',
        description: 'Store QA review results. Returns review_id.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID this review belongs to',
            },
            step_id: {
              type: 'string',
              description: 'Step ID that performed the review',
            },
            artifact_id: {
              type: 'string',
              description: 'Artifact ID that was reviewed',
            },
            reviewer_agent: {
              type: 'string',
              description: 'Agent that performed the review',
            },
            rubric_id: {
              type: 'string',
              description: 'Rubric used for review (optional)',
            },
            verdict: {
              type: 'string',
              enum: ['pass', 'conditional-pass', 'fail'],
              description: 'Review verdict',
            },
            findings: {
              type: 'array',
              description: 'Array of finding objects',
            },
          },
          required: ['run_id', 'step_id', 'artifact_id', 'reviewer_agent', 'verdict', 'findings'],
        },
      },
      {
        name: 'save_merge_report',
        description: 'Store merge operation report. Returns merge_id.',
        inputSchema: {
          type: 'object',
          properties: {
            run_id: {
              type: 'string',
              description: 'Run ID this merge belongs to',
            },
            step_id: {
              type: 'string',
              description: 'Step ID that performed the merge',
            },
            source_artifact_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Source artifact IDs that were merged',
            },
            output_artifact_id: {
              type: 'string',
              description: 'Output artifact ID from merge',
            },
            merge_strategy: {
              type: 'string',
              description: 'Merge strategy used',
            },
            conflicts_detected: {
              type: 'number',
              description: 'Number of conflicts detected',
            },
            conflict_resolutions: {
              type: 'array',
              description: 'Array of conflict resolution objects (optional)',
            },
          },
          required: ['run_id', 'step_id', 'source_artifact_ids', 'output_artifact_id', 'merge_strategy'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'start_run': {
        const runId = uuidv4();
        const now = getCurrentTimestamp();
        const inputParamsJson = args.input_params ? JSON.stringify(args.input_params) : null;

        const stmt = db.prepare(`
          INSERT INTO runs (run_id, workflow, project, status, input_params, started_at, updated_at)
          VALUES (?, ?, ?, 'running', ?, ?, ?)
        `);
        stmt.run(runId, args.workflow, args.project || null, inputParamsJson, now, now);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ run_id: runId, started_at: now }, null, 2),
            },
          ],
        };
      }

      case 'save_step': {
        const stepId = uuidv4();
        const now = getCurrentTimestamp();

        const stmt = db.prepare(`
          INSERT INTO steps (step_id, run_id, step_name, agent, input_summary, output_summary, status, duration_ms, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          stepId,
          args.run_id,
          args.step_name,
          args.agent,
          args.input_summary || null,
          args.output_summary || null,
          args.status,
          args.duration_ms || null,
          now
        );

        const updateStmt = db.prepare('UPDATE runs SET updated_at = ? WHERE run_id = ?');
        updateStmt.run(now, args.run_id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ step_id: stepId }, null, 2),
            },
          ],
        };
      }

      case 'save_artifact': {
        const artifactId = uuidv4();
        const now = getCurrentTimestamp();
        const sizeBytes = Buffer.byteLength(args.content, 'utf-8');
        const metadataJson = args.metadata ? JSON.stringify(args.metadata) : null;

        let storedPath = null;
        let content = null;

        if (sizeBytes > 10240) {
          const runDir = ensureArtifactsDir(args.run_id);
          const filename = `${artifactId}.txt`;
          storedPath = join(runDir, filename);
          fs.writeFileSync(storedPath, args.content, 'utf-8');
        } else {
          content = args.content;
        }

        const stmt = db.prepare(`
          INSERT INTO artifacts (artifact_id, run_id, step_id, artifact_type, content, stored_path, metadata, size_bytes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          artifactId,
          args.run_id,
          args.step_id,
          args.artifact_type,
          content,
          storedPath,
          metadataJson,
          sizeBytes,
          now
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ artifact_id: artifactId, stored_path: storedPath }, null, 2),
            },
          ],
        };
      }

      case 'save_blocker': {
        const blockerId = uuidv4();
        const now = getCurrentTimestamp();

        const stmt = db.prepare(`
          INSERT INTO blockers (blocker_id, run_id, step_id, blocker_type, description, resolution_required, severity, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          blockerId,
          args.run_id,
          args.step_id,
          args.blocker_type,
          args.description,
          args.resolution_required,
          args.severity,
          now
        );

        if (args.severity === 'blocking') {
          const updateStmt = db.prepare('UPDATE runs SET status = ?, updated_at = ? WHERE run_id = ?');
          updateStmt.run('paused', now, args.run_id);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ blocker_id: blockerId }, null, 2),
            },
          ],
        };
      }

      case 'fetch_run_context': {
        const runStmt = db.prepare('SELECT * FROM runs WHERE run_id = ?');
        const run = runStmt.get(args.run_id);

        if (!run) {
          throw new Error(`Run not found: ${args.run_id}`);
        }

        const stepsStmt = db.prepare('SELECT * FROM steps WHERE run_id = ? ORDER BY created_at ASC');
        const steps = stepsStmt.all(args.run_id);

        const artifactsStmt = db.prepare('SELECT * FROM artifacts WHERE run_id = ? ORDER BY created_at ASC');
        const artifacts = artifactsStmt.all(args.run_id);

        if (args.include_artifacts) {
          for (const artifact of artifacts) {
            if (artifact.stored_path && !artifact.content) {
              artifact.content = fs.readFileSync(artifact.stored_path, 'utf-8');
            }
          }
        }

        const blockersStmt = db.prepare('SELECT * FROM blockers WHERE run_id = ? ORDER BY created_at ASC');
        const blockers = blockersStmt.all(args.run_id);

        if (run.input_params) {
          run.input_params = JSON.parse(run.input_params);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  run,
                  steps,
                  artifacts,
                  blockers,
                  current_status: run.status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'fetch_resume_point': {
        const stmt = db.prepare(`
          SELECT * FROM resume_points 
          WHERE run_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `);
        const resumePoint = stmt.get(args.run_id);

        if (resumePoint) {
          resumePoint.state_snapshot = JSON.parse(resumePoint.state_snapshot);
          resumePoint.artifact_ids = resumePoint.artifact_ids ? JSON.parse(resumePoint.artifact_ids) : [];
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(resumePoint || null, null, 2),
            },
          ],
        };
      }

      case 'list_run_artifacts': {
        let query = 'SELECT * FROM artifacts WHERE run_id = ?';
        const params = [args.run_id];

        if (args.artifact_type) {
          query += ' AND artifact_type = ?';
          params.push(args.artifact_type);
        }

        if (args.step_id) {
          query += ' AND step_id = ?';
          params.push(args.step_id);
        }

        query += ' ORDER BY created_at ASC';

        const stmt = db.prepare(query);
        const artifacts = stmt.all(...params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ artifacts }, null, 2),
            },
          ],
        };
      }

      case 'close_run': {
        const now = getCurrentTimestamp();

        const stmt = db.prepare(`
          UPDATE runs 
          SET status = ?, closed_at = ?, updated_at = ?, summary = ?
          WHERE run_id = ?
        `);
        const result = stmt.run(args.status, now, now, args.summary || null, args.run_id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: result.changes > 0, closed_at: now }, null, 2),
            },
          ],
        };
      }

      case 'save_resume_point': {
        const resumePointId = uuidv4();
        const now = getCurrentTimestamp();
        const stateSnapshotJson = JSON.stringify(args.state_snapshot);
        const artifactIdsJson = args.artifact_ids ? JSON.stringify(args.artifact_ids) : null;

        const stmt = db.prepare(`
          INSERT INTO resume_points (resume_point_id, run_id, step_index, checkpoint_name, state_snapshot, artifact_ids, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          resumePointId,
          args.run_id,
          args.step_index,
          args.checkpoint_name || null,
          stateSnapshotJson,
          artifactIdsJson,
          now
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ resume_point_id: resumePointId }, null, 2),
            },
          ],
        };
      }

      case 'save_review_output': {
        const reviewId = uuidv4();
        const now = getCurrentTimestamp();
        const findingsJson = JSON.stringify(args.findings);

        const stmt = db.prepare(`
          INSERT INTO review_outputs (review_id, run_id, step_id, artifact_id, reviewer_agent, rubric_id, verdict, findings, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          reviewId,
          args.run_id,
          args.step_id,
          args.artifact_id,
          args.reviewer_agent,
          args.rubric_id || null,
          args.verdict,
          findingsJson,
          now
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ review_id: reviewId }, null, 2),
            },
          ],
        };
      }

      case 'save_merge_report': {
        const mergeId = uuidv4();
        const now = getCurrentTimestamp();
        const sourceArtifactIdsJson = JSON.stringify(args.source_artifact_ids);
        const conflictResolutionsJson = args.conflict_resolutions ? JSON.stringify(args.conflict_resolutions) : null;

        const stmt = db.prepare(`
          INSERT INTO merge_reports (merge_id, run_id, step_id, source_artifact_ids, output_artifact_id, merge_strategy, conflicts_detected, conflict_resolutions, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          mergeId,
          args.run_id,
          args.step_id,
          sourceArtifactIdsJson,
          args.output_artifact_id,
          args.merge_strategy,
          args.conflicts_detected || 0,
          conflictResolutionsJson,
          now
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ merge_id: mergeId }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`[cache-server] Error in ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  initDatabase();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[cache-server] Cache server running on stdio');
}

main().catch((error) => {
  console.error('[cache-server] Fatal error:', error);
  process.exit(1);
});
