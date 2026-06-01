/**
 * Guide Server — Database Layer
 * Wraps better-sqlite3 with guide-specific operations.
 * All operations are synchronous (better-sqlite3 design).
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Initialization ──────────────────────────────────────────────────────────

let _db = null;

export function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

export function initDb(dbPath = null) {
  const path = dbPath ?? process.env.GUIDE_DB_PATH ?? join(__dirname, '..', 'guides.db');
  _db = new Database(path);

  // Apply schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  _db.exec(schema);

  // Performance settings
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');

  return _db;
}

// ── Guide CRUD ──────────────────────────────────────────────────────────────

export function addGuide({ id, title, type, domain, status = 'draft', body, tags = [], applies_to = [], version = '1.0' }) {
  const db = getDb();
  validateGuideType(type);

  const guideId = id ?? `G-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO guides (id, title, type, domain, status, body, tags, applies_to, version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    guideId, title, type, domain ?? null, status, body,
    JSON.stringify(tags), JSON.stringify(applies_to), version, now, now
  );

  return getGuide(guideId);
}

export function getGuide(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM guides WHERE id = ?').get(id);
  if (!row) return null;
  return deserializeGuide(row);
}

export function updateGuide(id, updates) {
  const db = getDb();
  const guide = getGuide(id);
  if (!guide) throw new Error(`Guide not found: ${id}`);

  const allowed = ['title', 'domain', 'body', 'tags', 'applies_to', 'version'];
  const fields = [];
  const values = [];

  for (const key of allowed) {
    if (key in updates) {
      fields.push(`${key} = ?`);
      values.push(
        (key === 'tags' || key === 'applies_to')
          ? JSON.stringify(updates[key])
          : updates[key]
      );
    }
  }

  if (fields.length === 0) throw new Error('No valid fields to update.');

  values.push(id);
  db.prepare(`UPDATE guides SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getGuide(id);
}

export function promoteGuide(id, promotedBy = 'system') {
  const db = getDb();
  const guide = getGuide(id);
  if (!guide) throw new Error(`Guide not found: ${id}`);
  if (guide.status === 'active') return guide; // already active

  db.prepare(`
    UPDATE guides
    SET status = 'active', promoted_at = ?, promoted_by = ?
    WHERE id = ?
  `).run(new Date().toISOString(), promotedBy, id);

  return getGuide(id);
}

export function deprecateGuide(id, { deprecatedBy = 'system', reason, supersededBy = null } = {}) {
  const db = getDb();
  const guide = getGuide(id);
  if (!guide) throw new Error(`Guide not found: ${id}`);
  if (guide.status === 'deprecated') return guide; // already deprecated

  db.prepare(`
    UPDATE guides
    SET status = 'deprecated',
        deprecated_at = ?,
        deprecated_by = ?,
        deprecation_reason = ?,
        superseded_by = ?
    WHERE id = ?
  `).run(new Date().toISOString(), deprecatedBy, reason ?? null, supersededBy ?? null, id);

  return getGuide(id);
}

export function listGuides({ type, domain, status, limit = 50, offset = 0 } = {}) {
  const db = getDb();
  const conditions = [];
  const values = [];

  if (type) { conditions.push('type = ?'); values.push(type); }
  if (domain) { conditions.push('domain = ?'); values.push(domain); }
  if (status) { conditions.push('status = ?'); values.push(status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(limit, offset);

  const rows = db.prepare(`
    SELECT * FROM guides ${where}
    ORDER BY type, domain, title
    LIMIT ? OFFSET ?
  `).all(...values);

  return rows.map(deserializeGuide);
}

// ── FTS Search ──────────────────────────────────────────────────────────────

export function searchGuides({ query, type, domain, status = 'active', limit = 10 }) {
  const db = getDb();

  if (!query || query.trim() === '') {
    return listGuides({ type, domain, status, limit });
  }

  // Build FTS query — append * for prefix matching on last token
  const ftsQuery = query.trim().split(/\s+/).map((t, i, arr) =>
    i === arr.length - 1 ? `${t}*` : t
  ).join(' ');

  const conditions = ['guides_fts MATCH ?'];
  const values = [ftsQuery];

  if (type)   { conditions.push('g.type = ?');   values.push(type); }
  if (domain) { conditions.push('g.domain = ?'); values.push(domain); }
  if (status) { conditions.push('g.status = ?'); values.push(status); }

  values.push(limit);

  const rows = db.prepare(`
    SELECT g.*, bm25(guides_fts) AS rank
    FROM guides_fts
    JOIN guides g ON guides_fts.rowid = g.rowid
    WHERE ${conditions.join(' AND ')}
    ORDER BY rank
    LIMIT ?
  `).all(...values);

  return rows.map(deserializeGuide);
}

// ── Guide Links ─────────────────────────────────────────────────────────────

const VALID_LINK_TYPES = ['implements', 'extends', 'references', 'supersedes', 'exemplifies', 'contradicts', 'requires'];

export function linkGuides({ sourceId, targetId, linkType, note = null }) {
  const db = getDb();

  if (!VALID_LINK_TYPES.includes(linkType)) {
    throw new Error(`Invalid link type: ${linkType}. Valid types: ${VALID_LINK_TYPES.join(', ')}`);
  }

  const source = getGuide(sourceId);
  const target = getGuide(targetId);
  if (!source) throw new Error(`Source guide not found: ${sourceId}`);
  if (!target) throw new Error(`Target guide not found: ${targetId}`);

  const id = `L-${randomUUID().slice(0, 8).toUpperCase()}`;

  db.prepare(`
    INSERT OR REPLACE INTO guide_links (id, source_id, target_id, link_type, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, sourceId, targetId, linkType, note, new Date().toISOString());

  return { id, sourceId, targetId, linkType, note };
}

export function getLinks(guideId, { direction = 'both' } = {}) {
  const db = getDb();
  const links = [];

  if (direction === 'outgoing' || direction === 'both') {
    const rows = db.prepare(`
      SELECT gl.*, g.title AS target_title, g.type AS target_type
      FROM guide_links gl
      JOIN guides g ON gl.target_id = g.id
      WHERE gl.source_id = ?
    `).all(guideId);
    links.push(...rows.map(r => ({ ...r, direction: 'outgoing' })));
  }

  if (direction === 'incoming' || direction === 'both') {
    const rows = db.prepare(`
      SELECT gl.*, g.title AS source_title, g.type AS source_type
      FROM guide_links gl
      JOIN guides g ON gl.source_id = g.id
      WHERE gl.target_id = ?
    `).all(guideId);
    links.push(...rows.map(r => ({ ...r, direction: 'incoming' })));
  }

  return links;
}

// ── Gap Check ───────────────────────────────────────────────────────────────

const REQUIRED_TYPES_BY_DOMAIN = {
  'general':   ['doctrine', 'style-pack', 'rubric', 'anti-pattern'],
  'dnd':       ['doctrine', 'style-pack', 'canon', 'rubric', 'template', 'anti-pattern'],
  'card-game': ['doctrine', 'style-pack', 'canon', 'rubric', 'template', 'anti-pattern'],
  'technical': ['doctrine', 'style-pack', 'rubric', 'template', 'anti-pattern'],
  'internal':  ['doctrine', 'style-pack', 'rubric', 'template'],
};

export function guideGapCheck({ domain, task }) {
  const db = getDb();
  const required = REQUIRED_TYPES_BY_DOMAIN[domain] ?? ['doctrine', 'style-pack', 'rubric'];
  const gaps = [];

  for (const type of required) {
    const count = db.prepare(
      "SELECT COUNT(*) as n FROM guides WHERE type = ? AND (domain = ? OR domain = 'general') AND status = 'active'"
    ).get(type, domain)?.n ?? 0;

    if (count === 0) {
      gaps.push({ type, domain, message: `No active ${type} guide found for domain '${domain}'` });
    }
  }

  // Task-specific checks
  if (task) {
    const taskRelated = searchGuides({ query: task, status: 'active', limit: 3 });
    if (taskRelated.length === 0) {
      gaps.push({ type: 'any', domain, message: `No guides found relevant to task: "${task}"` });
    }
  }

  return { domain, task: task ?? null, gaps, gapCount: gaps.length };
}

// ── Stats ───────────────────────────────────────────────────────────────────

export function getStats() {
  const db = getDb();
  const total     = db.prepare("SELECT COUNT(*) as n FROM guides").get().n;
  const active    = db.prepare("SELECT COUNT(*) as n FROM guides WHERE status = 'active'").get().n;
  const draft     = db.prepare("SELECT COUNT(*) as n FROM guides WHERE status = 'draft'").get().n;
  const deprecated = db.prepare("SELECT COUNT(*) as n FROM guides WHERE status = 'deprecated'").get().n;
  const byType    = db.prepare("SELECT type, COUNT(*) as n FROM guides GROUP BY type").all();
  const linkCount = db.prepare("SELECT COUNT(*) as n FROM guide_links").get().n;

  return { total, active, draft, deprecated, byType, linkCount };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const VALID_TYPES = ['doctrine', 'style-pack', 'canon', 'template', 'rubric', 'example', 'anti-pattern', 'decision-record'];

function validateGuideType(type) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid guide type: "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
  }
}

function deserializeGuide(row) {
  return {
    ...row,
    tags:       JSON.parse(row.tags       ?? '[]'),
    applies_to: JSON.parse(row.applies_to ?? '[]'),
  };
}
