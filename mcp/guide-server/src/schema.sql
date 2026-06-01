-- Editorial Orchestrator — Guide Server Schema
-- SQLite with FTS5
-- Version: 1.0 (Phase 3)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- GUIDES
-- Core record table. All guide types share this table.
-- Type determines which fields are semantically required.
-- ============================================================

CREATE TABLE IF NOT EXISTS guides (
    id           TEXT PRIMARY KEY,
    title        TEXT NOT NULL,
    type         TEXT NOT NULL CHECK(type IN (
                   'doctrine',
                   'style-pack',
                   'canon',
                   'template',
                   'rubric',
                   'example',
                   'anti-pattern',
                   'decision-record'
                 )),
    domain       TEXT,                          -- e.g. 'general', 'dnd', 'card-game', 'technical', 'internal'
    status       TEXT NOT NULL DEFAULT 'draft'
                   CHECK(status IN ('draft', 'active', 'deprecated')),
    body         TEXT NOT NULL,                 -- Full markdown content of the guide
    tags         TEXT NOT NULL DEFAULT '[]',    -- JSON array: ["tag1","tag2"]
    applies_to   TEXT NOT NULL DEFAULT '[]',    -- JSON array: phases, agents, or commands this applies to
    version      TEXT NOT NULL DEFAULT '1.0',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    promoted_at  TEXT,
    promoted_by  TEXT,
    deprecated_at      TEXT,
    deprecated_by      TEXT,
    deprecation_reason TEXT,
    superseded_by      TEXT REFERENCES guides(id)
);

CREATE INDEX IF NOT EXISTS idx_guides_type   ON guides(type);
CREATE INDEX IF NOT EXISTS idx_guides_domain ON guides(domain);
CREATE INDEX IF NOT EXISTS idx_guides_status ON guides(status);
CREATE INDEX IF NOT EXISTS idx_guides_type_domain ON guides(type, domain);

-- ============================================================
-- FTS5 FULL-TEXT INDEX
-- Content table mirrors guides for FTS without data duplication.
-- Triggers keep it in sync on INSERT/UPDATE/DELETE.
-- ============================================================

CREATE VIRTUAL TABLE IF NOT EXISTS guides_fts USING fts5(
    id        UNINDEXED,
    title,
    body,
    tags,
    domain    UNINDEXED,
    applies_to,
    content   = 'guides',
    content_rowid = 'rowid',
    tokenize  = 'porter ascii'
);

-- Sync triggers: FTS kept in sync with guides table
CREATE TRIGGER IF NOT EXISTS guides_ai
AFTER INSERT ON guides BEGIN
    INSERT INTO guides_fts(rowid, id, title, body, tags, domain, applies_to)
    VALUES (new.rowid, new.id, new.title, new.body, new.tags, new.domain, new.applies_to);
END;

CREATE TRIGGER IF NOT EXISTS guides_au
AFTER UPDATE ON guides BEGIN
    INSERT INTO guides_fts(guides_fts, rowid, id, title, body, tags, domain, applies_to)
    VALUES ('delete', old.rowid, old.id, old.title, old.body, old.tags, old.domain, old.applies_to);
    INSERT INTO guides_fts(rowid, id, title, body, tags, domain, applies_to)
    VALUES (new.rowid, new.id, new.title, new.body, new.tags, new.domain, new.applies_to);
END;

CREATE TRIGGER IF NOT EXISTS guides_ad
AFTER DELETE ON guides BEGIN
    INSERT INTO guides_fts(guides_fts, rowid, id, title, body, tags, domain, applies_to)
    VALUES ('delete', old.rowid, old.id, old.title, old.body, old.tags, old.domain, old.applies_to);
END;

-- updated_at auto-update trigger
CREATE TRIGGER IF NOT EXISTS guides_updated_at
AFTER UPDATE ON guides BEGIN
    UPDATE guides SET updated_at = datetime('now') WHERE id = new.id;
END;

-- ============================================================
-- GUIDE LINKS
-- Typed directed links between guide records.
-- Link types capture the semantic relationship.
-- ============================================================

CREATE TABLE IF NOT EXISTS guide_links (
    id          TEXT PRIMARY KEY,
    source_id   TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    target_id   TEXT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    link_type   TEXT NOT NULL CHECK(link_type IN (
                  'implements',     -- source implements the rule in target
                  'extends',        -- source extends target with more specific rules
                  'references',     -- source references target for context
                  'supersedes',     -- source supersedes target (target should be deprecated)
                  'exemplifies',    -- source is a worked example of target
                  'contradicts',    -- source conflicts with target (flag for resolution)
                  'requires'        -- source requires target to be loaded first
                )),
    note        TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_links_source ON guide_links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON guide_links(target_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_unique ON guide_links(source_id, target_id, link_type);

-- ============================================================
-- SCHEMA VERSION
-- Tracks applied migrations for future upgrade support.
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT
);

INSERT OR IGNORE INTO schema_version(version, description)
VALUES (1, 'Initial schema: guides, guides_fts, guide_links');
