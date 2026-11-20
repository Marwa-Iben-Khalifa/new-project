// Simple zero-dependency JSON store with atomic writes.
// Not a production database — good enough for the MVP / local testing.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'db.json');

const EMPTY = { merchants: [], reports: [], lookups: [], contestations: [] };

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function load() {
  ensureDir();
  if (!existsSync(DATA_FILE)) return structuredClone(EMPTY);
  try {
    const raw = readFileSync(DATA_FILE, 'utf8');
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function save(db) {
  ensureDir();
  const tmp = DATA_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, DATA_FILE); // atomic on same filesystem
}

export function resetFile() {
  ensureDir();
  save(structuredClone(EMPTY));
}
