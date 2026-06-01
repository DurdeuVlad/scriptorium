/**
 * Guide Server — Seed Script
 * Loads all seed JSON files from seeds/ into the guide database.
 *
 * Usage:
 *   node src/seed.js [--reset]
 *
 * Options:
 *   --reset   Drop and recreate all guides before seeding (idempotent re-seed)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDb, addGuide, promoteGuide, linkGuides, getGuide } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = join(__dirname, '..', 'seeds');

const reset = process.argv.includes('--reset');

// ── Initialize DB ───────────────────────────────────────────────────────────

const db = initDb();

if (reset) {
  process.stderr.write('[seed] --reset: deleting all guide records\n');
  db.exec("DELETE FROM guide_links; DELETE FROM guides;");
}

// ── Load Seed Files ─────────────────────────────────────────────────────────

let loaded = 0;
let skipped = 0;
let errors = 0;
const linkQueue = []; // defer link creation until all guides are loaded

function loadSeedDir(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // directory doesn't exist yet, skip silently
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      loadSeedDir(fullPath);
      continue;
    }
    if (!entry.endsWith('.json') || entry.startsWith('_')) continue;

    let seed;
    try {
      seed = JSON.parse(readFileSync(fullPath, 'utf8'));
    } catch (err) {
      process.stderr.write(`[seed] ERROR parsing ${fullPath}: ${err.message}\n`);
      errors++;
      continue;
    }

    // Handle both single records and arrays
    const records = Array.isArray(seed) ? seed : [seed];

    for (const record of records) {
      try {
        // Extract links before inserting (links require both guides to exist)
        const links = record._links ?? [];
        const { _links, ...guideData } = record;

        // Skip if already exists and not in reset mode
        if (!reset && getGuide(guideData.id)) {
          skipped++;
          continue;
        }

        const guide = addGuide(guideData);

        // Auto-promote if status is 'active' in seed
        if (guideData.status === 'active') {
          promoteGuide(guide.id, 'seed-script');
        }

        // Queue links for later
        for (const link of links) {
          linkQueue.push({ sourceId: guide.id, ...link });
        }

        loaded++;
        process.stderr.write(`[seed] loaded ${guide.type} "${guide.title}" (${guide.id})\n`);

      } catch (err) {
        process.stderr.write(`[seed] ERROR loading record from ${fullPath}: ${err.message}\n`);
        errors++;
      }
    }
  }
}

loadSeedDir(SEEDS_DIR);

// ── Create Links ────────────────────────────────────────────────────────────

for (const link of linkQueue) {
  try {
    linkGuides(link);
    process.stderr.write(`[seed] linked ${link.sourceId} --${link.linkType}--> ${link.targetId}\n`);
  } catch (err) {
    process.stderr.write(`[seed] WARN link ${link.sourceId} -> ${link.targetId}: ${err.message}\n`);
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────

process.stderr.write(`\n[seed] complete: ${loaded} loaded, ${skipped} skipped, ${errors} errors, ${linkQueue.length} links processed\n`);
