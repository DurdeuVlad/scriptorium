#!/usr/bin/env node
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'artifacts.db');
const SCHEMA_PATH = join(__dirname, '..', 'schema.sql');

console.log('Setting up artifact-server database...');
console.log(`Database path: ${DB_PATH}`);

const db = new Database(DB_PATH);
const schema = readFileSync(SCHEMA_PATH, 'utf-8');

db.exec(schema);

console.log('✓ Database schema created successfully');
console.log('✓ artifact-server setup complete');

db.close();
