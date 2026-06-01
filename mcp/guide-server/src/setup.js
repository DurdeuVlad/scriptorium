/**
 * Guide Server — Setup Script
 * Initializes the database schema without seeding.
 * Run once after npm install, before starting the server.
 *
 * Usage:
 *   node src/setup.js
 */

import { initDb, getStats } from './db.js';

const db = initDb();
const stats = getStats();

process.stderr.write(`[setup] database initialized\n`);
process.stderr.write(`[setup] guides: ${stats.total} total (${stats.active} active, ${stats.draft} draft, ${stats.deprecated} deprecated)\n`);
process.stderr.write(`[setup] run "npm run seed" to load initial guide records\n`);
