import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EMPTY_DB } from './dbApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.json');

export function createFileStorage() {
  return {
    async loadDb() {
      try {
        if (!fs.existsSync(DB_PATH)) {
          const empty = structuredClone(EMPTY_DB);
          fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
          return empty;
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      } catch {
        return structuredClone(EMPTY_DB);
      }
    },
    async saveDb(db) {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    },
  };
}
