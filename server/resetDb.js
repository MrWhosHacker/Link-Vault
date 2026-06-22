/**
 * Reset local file-backed DB for dev testing.
 * Usage: npm run db:reset
 *
 * Production (Netlify): call DELETE /api/admin/reset-db with body { "secret": "<ADMIN_RESET_SECRET>" }
 * or clear the linkvault-db blob manually in the Netlify dashboard.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EMPTY_DB } from './dbApi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.json');

fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
console.log('Wiped server/db.json:', JSON.stringify(EMPTY_DB));
