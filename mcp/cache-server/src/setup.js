#!/usr/bin/env node

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.CACHE_DB_PATH || join(__dirname, '..', 'cache.db');

console.log('[setup] Initializing cache-server database...');

if (fs.existsSync(DB_PATH)) {
  console.log(`[setup] Removing existing database at ${DB_PATH}`);
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = join(__dirname, '..', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

console.log('[setup] Creating tables...');
db.exec(schema);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('[setup] Created tables:', tables.map(t => t.name).join(', '));

db.close();

console.log('[setup] Database initialized successfully');
console.log(`[setup] Location: ${DB_PATH}`);
console.log('[setup] Run "npm run seed" to add test data');
